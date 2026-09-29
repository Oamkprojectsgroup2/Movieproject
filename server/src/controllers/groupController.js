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