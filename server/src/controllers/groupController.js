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