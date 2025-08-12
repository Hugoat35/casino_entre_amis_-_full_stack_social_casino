import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const sendFriendRequest = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    
    if (!targetProfile) throw new Error("User not found");
    if (targetProfile.userId === userId) throw new Error("Cannot add yourself as friend");
    
    // Check if friendship already exists
    const existingFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_requester", (q) => q.eq("requesterId", userId))
      .filter((q) => q.eq(q.field("addresseeId"), targetProfile.userId))
      .first();
    
    const reverseExisting = await ctx.db
      .query("friendships")
      .withIndex("by_requester", (q) => q.eq("requesterId", targetProfile.userId))
      .filter((q) => q.eq(q.field("addresseeId"), userId))
      .first();
    
    if (existingFriendship || reverseExisting) {
      throw new Error("Friend request already sent or friendship exists");
    }
    
    return await ctx.db.insert("friendships", {
      requesterId: userId,
      addresseeId: targetProfile.userId,
      status: "pending",
    });
  },
});

export const acceptFriendRequest = mutation({
  args: {
    requestId: v.id("friendships"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const friendship = await ctx.db.get(args.requestId);
    if (!friendship) throw new Error("Friend request not found");
    if (friendship.addresseeId !== userId) throw new Error("Not authorized");
    if (friendship.status !== "pending") throw new Error("Request already processed");
    
    await ctx.db.patch(args.requestId, {
      status: "accepted",
    });
    
    return args.requestId;
  },
});

export const rejectFriendRequest = mutation({
  args: {
    requestId: v.id("friendships"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const friendship = await ctx.db.get(args.requestId);
    if (!friendship) throw new Error("Friend request not found");
    if (friendship.addresseeId !== userId) throw new Error("Not authorized");
    if (friendship.status !== "pending") throw new Error("Request already processed");
    
    await ctx.db.delete(args.requestId);
    return true;
  },
});

export const getFriends = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const friendships = await ctx.db
      .query("friendships")
      .filter((q) => 
        q.or(
          q.and(q.eq(q.field("requesterId"), userId), q.eq(q.field("status"), "accepted")),
          q.and(q.eq(q.field("addresseeId"), userId), q.eq(q.field("status"), "accepted"))
        )
      )
      .collect();
    
    const friends = [];
    for (const friendship of friendships) {
      const friendId = friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId;
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", friendId))
        .unique();
      
      if (profile) {
        friends.push(profile);
      }
    }
    
    return friends;
  },
});

export const getFriendRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const requests = await ctx.db
      .query("friendships")
      .withIndex("by_addressee", (q) => q.eq("addresseeId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    
    const requestsWithProfiles = [];
    for (const request of requests) {
      const requesterProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", request.requesterId))
        .unique();
      
      if (requesterProfile) {
        requestsWithProfiles.push({
          ...request,
          requesterUsername: requesterProfile.username,
          requesterAvatar: requesterProfile.avatar,
        });
      }
    }
    
    return requestsWithProfiles;
  },
});

export const sendChatMessage = mutation({
  args: {
    content: v.string(),
    type: v.union(v.literal("global"), v.literal("table"), v.literal("private")),
    tableId: v.optional(v.id("gameTables")),
    recipientId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    if (args.content.trim().length === 0) throw new Error("Message cannot be empty");
    if (args.content.length > 500) throw new Error("Message too long");
    
    return await ctx.db.insert("chatMessages", {
      senderId: userId,
      type: args.type,
      content: args.content.trim(),
      tableId: args.tableId,
      recipientId: args.recipientId,
    });
  },
});

export const getChatMessages = query({
  args: {
    type: v.union(v.literal("global"), v.literal("table"), v.literal("private")),
    tableId: v.optional(v.id("gameTables")),
    recipientId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    let query = ctx.db.query("chatMessages").withIndex("by_type", (q) => q.eq("type", args.type));
    
    if (args.type === "table" && args.tableId) {
      query = ctx.db.query("chatMessages").withIndex("by_table", (q) => q.eq("tableId", args.tableId));
    } else if (args.type === "private" && args.recipientId) {
      query = ctx.db.query("chatMessages").withIndex("by_private", (q) => 
        q.eq("senderId", userId).eq("recipientId", args.recipientId)
      );
    }
    
    const messages = await query.order("desc").take(args.limit || 50);
    
    // Get sender profiles
    const messagesWithProfiles = [];
    for (const message of messages) {
      const senderProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", message.senderId))
        .unique();
      
      messagesWithProfiles.push({
        ...message,
        senderProfile,
      });
    }
    
    return messagesWithProfiles.reverse();
  },
});

export const getOnlineFriends = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const friendships = await ctx.db
      .query("friendships")
      .filter((q) => 
        q.or(
          q.and(q.eq(q.field("requesterId"), userId), q.eq(q.field("status"), "accepted")),
          q.and(q.eq(q.field("addresseeId"), userId), q.eq(q.field("status"), "accepted"))
        )
      )
      .collect();
    
    const onlineFriends = [];
    for (const friendship of friendships) {
      const friendId = friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId;
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", friendId))
        .unique();
      
      if (profile && profile.isOnline) {
        onlineFriends.push(profile);
      }
    }
    
    return onlineFriends;
  },
});
