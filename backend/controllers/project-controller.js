import Project from '../models/project.js';
import User from '../models/user.js';
import Workspace from '../models/workspace.js';

// Create project
const createProject = async (req, res) => {
  try {
    const { title, description, status, startDate, endDate, categories } = req.body;
    const userId = req.userId;

    // Get user's current workspace
    const user = await User.findById(userId);
    if (!user.currentWorkspace) {
      return res.status(400).json({ message: "No active workspace found" });
    }

    // Verify all category members exist and are in workspace
    for (const category of categories) {
      for (const member of category.members) {
        const memberUser = await User.findOne({ 
          email: member.email,
          'workspaces.workspaceId': user.currentWorkspace 
        });
        
        if (!memberUser) {
          return res.status(400).json({ 
            message: `User ${member.email} is not found or not in workspace` 
          });
        }
        
        // Replace email with userId
        member.userId = memberUser._id;
        delete member.email;
      }
    }

    // Create project
    const project = await Project.create({
      title,
      description,
      status,
      startDate,
      endDate,
      workspace: user.currentWorkspace,
      creator: userId,
      categories
    });

    const populatedProject = await Project.findById(project._id)
      .populate('creator', 'name email')
      .populate('workspace', 'name')
      .populate('categories.members.userId', 'name email');

    res.status(201).json({
      message: "Project created successfully",
      project: populatedProject
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get single project details
const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    const project = await Project.findById(projectId)
      .populate('creator', 'name email')
      .populate('workspace', 'name')
      .populate('categories.members.userId', 'name email');

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user has access to this project
    const user = await User.findById(userId);
    if (user.currentWorkspace?.toString() !== project.workspace._id.toString()) {
      return res.status(403).json({ message: "Access denied to this project" });
    }

    res.status(200).json({ project });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get workspace members for project assignment
const getWorkspaceMembers = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user.currentWorkspace) {
      return res.status(400).json({ message: "No active workspace found" });
    }

    const workspace = await Workspace.findById(user.currentWorkspace)
      .populate('members.userId', 'name email');

    const members = workspace.members.map(member => ({
      _id: member.userId._id,
      name: member.userId.name,
      email: member.userId.email,
      role: member.role
    }));

    res.status(200).json({ members });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;
    const userId = req.userId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user can update this project (creator, admin, or super_admin)
    const user = await User.findById(userId);
    const canUpdate = project.creator.toString() === userId || 
                     ['admin', 'super_admin'].includes(user.role) ||
                     project.categories.some(cat => 
                       cat.members.some(member => 
                         member.userId.toString() === userId && 
                         ['Lead', 'Admin'].includes(member.role)
                       )
                     );

    if (!canUpdate) {
      return res.status(403).json({ message: "You don't have permission to update this project" });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId, 
      updates, 
      { new: true }
    )
    .populate('creator', 'name email')
    .populate('workspace', 'name')
    .populate('categories.members.userId', 'name email');

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only creator, admin, or super_admin can delete
    const user = await User.findById(userId);
    const canDelete = project.creator.toString() === userId || 
                     ['admin', 'super_admin'].includes(user.role);

    if (!canDelete) {
      return res.status(403).json({ message: "You don't have permission to delete this project" });
    }

    // Soft delete - set isActive to false
    await Project.findByIdAndUpdate(projectId, { isActive: false });

    res.status(200).json({ message: "Project deleted successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add member to project category
const addMemberToCategory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { categoryName, memberEmail, role } = req.body;
    const userId = req.userId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check permission
    const user = await User.findById(userId);
    const canAddMember = ['admin', 'super_admin'].includes(user.role) ||
                        project.creator.toString() === userId;

    if (!canAddMember) {
      return res.status(403).json({ message: "You don't have permission to add members" });
    }

    // Find the member to add
    const memberToAdd = await User.findOne({ 
      email: memberEmail,
      'workspaces.workspaceId': project.workspace
    });

    if (!memberToAdd) {
      return res.status(404).json({ message: "Member not found in workspace" });
    }

    // Find the category
    const categoryIndex = project.categories.findIndex(cat => cat.name === categoryName);
    if (categoryIndex === -1) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if member is already in this category
    const isAlreadyMember = project.categories[categoryIndex].members.some(
      member => member.userId.toString() === memberToAdd._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({ message: "Member is already in this category" });
    }

    // Add member to category
    project.categories[categoryIndex].members.push({
      userId: memberToAdd._id,
      role: role || 'Member'
    });

    await project.save();

    const updatedProject = await Project.findById(projectId)
      .populate('creator', 'name email')
      .populate('workspace', 'name')
      .populate('categories.members.userId', 'name email');

    res.status(200).json({
      message: "Member added to category successfully",
      project: updatedProject
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Remove member from project category
const removeMemberFromCategory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { categoryName, memberId } = req.body;
    const userId = req.userId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check permission
    const user = await User.findById(userId);
    const canRemoveMember = ['admin', 'super_admin'].includes(user.role) ||
                           project.creator.toString() === userId;

    if (!canRemoveMember) {
      return res.status(403).json({ message: "You don't have permission to remove members" });
    }

    // Find the category
    const categoryIndex = project.categories.findIndex(cat => cat.name === categoryName);
    if (categoryIndex === -1) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Remove member from category
    project.categories[categoryIndex].members = project.categories[categoryIndex].members.filter(
      member => member.userId.toString() !== memberId
    );

    await project.save();

    const updatedProject = await Project.findById(projectId)
      .populate('creator', 'name email')
      .populate('workspace', 'name')
      .populate('categories.members.userId', 'name email');

    res.status(200).json({
      message: "Member removed from category successfully",
      project: updatedProject
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get user's role in project
const getUserProjectRole = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const user = await User.findById(userId);
    
    let projectRole = 'viewer'; // default
    
    // Check if user is creator
    if (project.creator.toString() === userId) {
      projectRole = 'creator';
    }
    // Check if user is admin/super_admin
    else if (['admin', 'super_admin'].includes(user.role)) {
      projectRole = 'admin';
    }
    // Check user's role in project categories
    else {
      for (const category of project.categories) {
        const memberInCategory = category.members.find(
          member => member.userId.toString() === userId
        );
        if (memberInCategory) {
          projectRole = memberInCategory.role.toLowerCase();
          break;
        }
      }
    }

    res.status(200).json({ 
      projectRole,
      canEdit: ['creator', 'admin', 'lead'].includes(projectRole),
      canDelete: ['creator', 'admin'].includes(projectRole),
      canViewKanban: ['creator', 'admin', 'lead'].includes(projectRole)
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const changeMemberRoleInProject = async (req, res) => {
  try {
    const { projectId, categoryName, memberId } = req.params;
    const { newRole } = req.body;
    const userId = req.userId;

    if (!newRole || !['lead', 'member', 'viewer'].includes(newRole.toLowerCase())) {
      return res.status(400).json({ message: "Invalid role. Must be lead, member, or viewer" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check permission - only creator, admin, super_admin, or category leads can change roles
    const user = await User.findById(userId);
    const isCreator = project.creator.toString() === userId;
    const isAdmin = ['admin', 'super_admin'].includes(user.role);
    const isLead = project.categories.some(cat => 
      cat.members.some(member => 
        member.userId.toString() === userId && member.role === 'Lead'
      )
    );

    if (!isCreator && !isAdmin && !isLead) {
      return res.status(403).json({ message: "You don't have permission to change member roles" });
    }

    // Find the category
    const categoryIndex = project.categories.findIndex(cat => cat.name === categoryName);
    if (categoryIndex === -1) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Find the member
    const memberIndex = project.categories[categoryIndex].members.findIndex(
      member => member.userId.toString() === memberId
    );
    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found in this category" });
    }

    // Update role
    project.categories[categoryIndex].members[memberIndex].role = newRole;
    await project.save();

    const memberInfo = await User.findById(memberId, 'name email');

    res.status(200).json({
      message: `${memberInfo?.name}'s role changed to ${newRole} successfully`
    });

  } catch (error) {
    console.error('Change project member role error:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getWorkspaceProjects = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user.currentWorkspace) {
      return res.status(200).json({ projects: [] });
    }

    let projects;

    // ✅ FIXED: Project visibility logic
    if (['admin', 'super_admin'].includes(user.role)) {
      // Admin & Super Admin: See ALL projects in workspace
      projects = await Project.find({ 
        workspace: user.currentWorkspace,
        isActive: true 
      })
      .populate('creator', 'name email')
      .populate('categories.members.userId', 'name email')
      .sort({ createdAt: -1 });
    } else {
      // Regular users: Only see projects they are part of
      projects = await Project.find({
        workspace: user.currentWorkspace,
        isActive: true,
        $or: [
          { creator: userId }, // Projects they created
          { 'categories.members.userId': userId } // Projects they are assigned to
        ]
      })
      .populate('creator', 'name email')
      .populate('categories.members.userId', 'name email')
      .sort({ createdAt: -1 });
    }

    res.status(200).json({ projects });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  createProject,
  getWorkspaceProjects,
  getProjectDetails,
  getWorkspaceMembers,
  updateProject,
  deleteProject,
  addMemberToCategory,
  removeMemberFromCategory,
  changeMemberRoleInProject,
  getUserProjectRole
};
