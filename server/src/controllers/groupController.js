import * as groupService from "../models/groupService.js";

const MAX_NAME_LENGTH = 50;

export const createGroup = async (req, res) => {
  const groupName = typeof req.body?.group_name === "string"
    ? req.body.group_name.trim()
    : "";

  if (!groupName) {
    return res.status(400).json({ message: "Group name is required" });
  }

  if (groupName.length > MAX_NAME_LENGTH) {
    return res.status(400).json({ message: `Group name must be at most ${MAX_NAME_LENGTH} characters`}); 
  }

  try {
    const group = await groupService.createGroup(req.user.user_id, groupName);
    return res.status(201).json({ group });
  } catch (error) {
    console.error("Group create error:", error);
    return res.status(500).json({ message: "Could not create group"});
  }
};

export const listGroups = async (req, res) => {
  try {
    const groups = await groupService.listGroups(req.user?.user_id ?? null);
    return res.status(200).json({ groups });
  } catch (error) {
    console.error("Group list error:", error);
    return res.status(500).json({ message: "Could not load groups" });
  }
};

export const joinGroup = async (req,res) => {
  try {
    const {groupId} = req.params;
    const userId = req.user.user_id;

    if (!/^\d+$/.test(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const member = await groupService.joinGroup(groupId, userId);
    return res.status(201).json({message: "Join request successful", data: member});
  }
  catch (error) {
        //Code 23505 = PostgreSQL Unique Constraint Violation == join request already exists
        if (error.code === "23505") {
            return res.status(409).json({message: "Join request already exists"});
        }
        //Code 23503 = PostgreSQL Foreign Key Violation == group doesnt exist
        if (error.code === "23503") {
          return res.status(404).json({message: "Group or user not found"});
        }
        console.error("Group joining error: ", error);
        return res.status(500).json({message: "Group joining error"});
    }
};

export const leaveGroup = async (req,res) => {
  try {
    const {groupId} = req.params;
    const userId = req.user.user_id;

    if (!/^\d+$/.test(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }
    const isOwner = await groupService.ownerCheck(groupId, userId);
    if (isOwner) {
      return res.status(403).json({message: "Owner cannot leave group"});
    }
    const memberLeft = await groupService.removeMember(groupId, userId);
    //Should never happen realistically, but just in case
    if (!memberLeft.removed) {
      return res.status(404).json({message: "No member found"});
    }
    return res.status(200).json({message: "Member left successfully"});
  }
  catch (error) {
    console.error("Group leaving error: ", error);
    return res.status(500).json({message: "Group leaving error"});
  }
};

export const myStatus = async (req,res) => {
  try {
    const {groupId} = req.params;
    const userId = req.user.user_id;

    if (!/^\d+$/.test(groupId)) {
      return res.status(400).json({ message: "Invalid group id"});
    }
    const membership = await groupService.membershipCheck(groupId, userId);
    if (!membership) {
      return res.status(200).json({message: "No membership found", status: null});
    }
    return res.status(200).json({message: "Membership check successful", status: membership.status});
  }
  catch (error) {
    console.error("Membership check error:", error);
    return res.status(500).json({ message: "Membership check error" });
  }
};

export const memberList = async (req,res) => {
  try {
    const {groupId} = req.params;
    const ownerId = req.user.user_id;

    if (!/^\d+$/.test(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }
    const isOwner = await groupService.ownerCheck(groupId, ownerId);
    if (!isOwner) {
      return res.status(403).json({message: "Group ownership required"});
    }

    const pendingMembers = await groupService.getMemberList(groupId, ownerId);
    return res.status(200).json({
      message: "Member list fetch successful",
      data: pendingMembers
    })
  }
  catch (error) {
    console.error("Pending member fetch error:", error);
    return res.status(500).json({ message: "Member list fetch error" });
  }
};

export const memberAccept = async (req,res) => {
  try {
    const {groupId} = req.params;
    const {userId} = req.params;
    const ownerId = req.user.user_id;

    if (!/^\d+$/.test(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }
    if (!/^\d+$/.test(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const isOwner = await groupService.ownerCheck(groupId, ownerId);
    if (!isOwner) {
      return res.status(403).json({message: "Group ownership required"});
    }

    const acceptedMember = await groupService.acceptMember(groupId, userId);
    //Should never happen realistically, but just in case
    if (!acceptedMember) {
      return res.status(404).json({message: "No member found"});
    }
    return res.status(200).json({
      message: "Member accepted successfully",
      data: acceptedMember
    });
  }
  catch (error) {
    console.error("Member accept error:", error);
    return res.status(500).json({ message: "Member accept error" });
  }
};

export const memberReject = async (req,res) => {
  try {
    const {groupId} = req.params;
    const {userId} = req.params;
    const ownerId = req.user.user_id;

    if (!/^\d+$/.test(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }
    if (!/^\d+$/.test(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const isOwner = await groupService.ownerCheck(groupId, ownerId);
    if (!isOwner) {
      return res.status(403).json({message: "Group ownership required"});
    }

    const rejectedMember = await groupService.rejectMember(groupId, userId);
    //Should never happen realistically, but just in case
    if (!rejectedMember) {
      return res.status(404).json({message: "No member found"});
    }
    return res.status(200).json({
      message: "Member rejected succefully",
      data: rejectedMember
    });
  }
  catch (error) {
    console.error("Member reject error:", error);
    return res.status(500).json({ message: "Member reject error" });
  }
};

export const memberRemove = async (req,res) => {
  try {
    const {groupId} = req.params;
    const {userId} = req.params;
    const ownerId = req.user.user_id;

    if (!/^\d+$/.test(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }
    if (!/^\d+$/.test(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const isOwner = await groupService.ownerCheck(groupId, ownerId);
    if (!isOwner) {
      return res.status(403).json({message: "Group ownership required"});
    }
    if(Number(userId) === Number(ownerId)) {
      return res.status(400).json({message: "Owner cannot remove themselves"});
    }

    const removedMember = await groupService.removeMember(groupId, userId);
    //Should never happen realistically, but just in case
    if (!removedMember.removed) {
      return res.status(404).json({message: "No member found"});
    }
    return res.status(200).json({
      message: "Member removed successfully",
      data: removedMember
    });
  }
  catch (error) {
    console.error("Member remove error:", error);
    return res.status(500).json({ message: "Member remove error" });
  }
};

export const makeOwner = async (req,res) => {
  try {
    const {groupId} = req.params;
    const {userId} = req.params;
    const ownerId = req.user.user_id;

    if (!/^\d+$/.test(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }
    if (!/^\d+$/.test(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const isOwner = await groupService.ownerCheck(groupId, ownerId);
    if (!isOwner) {
      return res.status(403).json({message: "Group ownership required"});
    }
    const isMember = await groupService.membershipCheck(groupId, userId);
    if (isMember?.status !== 'accepted' || Number(userId) === Number(ownerId)) {
      return res.status(403).json({message: "Must be accepted group member"});
    }

    const newOwner = await groupService.makeOwner(groupId, userId);
    if (!newOwner) {
      return res.status(400).json({message: "Owner change error"});
    }
    return res.status(200).json({message: "Owner change successful", data: newOwner});
  }
  catch (error) {
    console.error("Owner change error:", error);
    return res.status(500).json({ message: "Owner change error" });
  }
};

export const getGroupDetails = async (req, res) => {
  const groupId = Number(req.params.groupId);

  if (!Number.isInteger(groupId) || groupId <= 0) {
    return res.status(400).json({ message: "Group ID must be a positive integer" });
  }

  try {
    const details = await groupService.getGroupDetails(groupId, req.user.user_id);

    if (!details) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!details.authorized) {
      return res.status(403).json({ message: "You do not have access to this group" });
    }

    return res.status(200).json({ group: details.group });
  } catch (error) {
    console.error("Group detail error:", error);
    return res.status(500).json({ message: "Could not load group" });
  }
};


export const deleteGroup = async (req, res) => {
  const groupId = Number(req.params.groupId);

  if (!Number.isInteger(groupId) || groupId <= 0) {
    return res.status(400).json({ message: "Group ID must be a positive integer" });
  }

  try {
    const result = await groupService.deleteGroup(groupId, req.user.user_id);

    if (result.notFound) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (result.unauthorized) {
      return res.status(403).json({ message: "Only the group owner can delete this group" });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Group delete error:", error);
    return res.status(500).json({ message: "Could not delete group" });
  }
};

export const addMovieToGroup = async (req, res) => {
  const groupId = Number(req.params.groupId);
  const movieId = Number(req.body?.movie_id);

 if (!Number.isInteger(groupId) || groupId <= 0) {
    return res.status(400).json({ message: "Group ID must be a positive integer" });
  }

  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ message: "Movie ID must be a positive integer" });
  }

  try {
    const result = await groupService.addMovieToGroup(
      groupId,
      movieId,
      req.user.user_id,
    );

    if (result.notFound) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (result.unauthorized) {
      return res.status(403).json({ message: "Only accepted group members can add movies" });
    }

    return res.status(result.added ? 201 : 200).json({
      message: result.added ? "Movie added to group" : "Movie is already in this group",
      added: result.added,
    });
  } catch (error) {
    console.error("Add group movie error:", error);
    return res.status(500).json({ message: "Could not add movie to group" });
  }
};

export const removeMovieFromGroup = async (req, res) => {
  const groupId = Number(req.params.groupId);
  const movieId = Number(req.params.movieId);

  if (!Number.isInteger(groupId) || groupId <= 0) {
    return res.status(400).json({ message: "Group ID must be a positive integer" });
  }

  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ message: "Movie ID must be a positive integer" });
  }

  try {
    const result = await groupService.removeMovieFromGroup(
      groupId,
      movieId,
      req.user.user_id,
    );

    if (result.notFound) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (result.unauthorized) {
      return res.status(403).json({ message: "Only the group owner can remove movies" });
    }

    if (result.movieNotFound) {
      return res.status(404).json({ message: "Movie not found in this group" });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Remove group movie error:", error);
    return res.status(500).json({ message: "Could not remove movie from group" });
  }
};
