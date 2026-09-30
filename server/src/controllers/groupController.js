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
    return res.status(201).json({message: "Join request successful", data: member})
  }
  catch (error){
        //Code 23505 = PostgreSQL Unique Constraint Violation == join reques already exists
        if (error.code === "23505") {
            return res.status(409).json({message: "Join request already exists"});
        }
        console.error("Group joining error: ", error);
        return res.status(500).json({message: "Group joining error"});
    }
};

export const pendingMembers = async (req,res) => {
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

    const pendingMembers = await groupService.getPendingMembers(groupId, ownerId);
    return res.status(200).json({
      message: "Pending members fetch successfull",
      data: pendingMembers
    })
  }
  catch (error) {
    console.error("Pending mmber fetch error:", error);
    return res.status(500).json({ message: "Pending ember fetch error" });
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
      return res.status(404).json({message: "No pending request found"});
    }
    return res.status(200).json({
      message: "Member accepted succefully",
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
      return res.status(404).json({message: "No pending request found"});
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
