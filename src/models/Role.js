import mongoose from 'mongoose';

/**
 * Role Model
 * Supports dynamic role creation with fine-grained permission assignments
 *
 * Features:
 * - System roles (predefined, cannot be deleted)
 * - Custom roles (organization-specific)
 * - Permission assignments
 * - Role hierarchy
 */

const roleSchema = new mongoose.Schema(
  {
    // Role name
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
      minlength: [2, 'Role name must be at least 2 characters'],
      maxlength: [50, 'Role name cannot exceed 50 characters'],
    },

    // Role key (unique identifier - for system roles)
    key: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // Allow null for custom roles
      match: [/^[a-z_]+$/, 'Role key must contain only lowercase letters and underscores'],
    },

    // Role description
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // Organization (null for system roles, organization ID for custom roles)
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null, // null = system role, available to all organizations
    },

    // Permissions assigned to this role
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],

    // Is this a system role (cannot be modified/deleted)
    isSystem: {
      type: Boolean,
      default: false,
    },

    // Is this role active
    isActive: {
      type: Boolean,
      default: true,
    },

    // Role level (for hierarchy - higher number = more power)
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
    },

    // Role color for UI (hex color)
    color: {
      type: String,
      default: '#6B7280',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'],
    },

    // Role icon for UI
    icon: {
      type: String,
      default: 'UserIcon',
    },

    // Number of users with this role
    userCount: {
      type: Number,
      default: 0,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },

    deletedAt: {
      type: Date,
      select: false,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
roleSchema.index({ organizationId: 1, name: 1 });
roleSchema.index({ key: 1 }, { unique: true, sparse: true });
roleSchema.index({ isSystem: 1, isActive: 1 });
roleSchema.index({ isDeleted: 1 });

// Virtual: Is custom role
roleSchema.virtual('isCustom').get(function () {
  return !this.isSystem && this.organizationId !== null;
});

// Virtual: Permission count
roleSchema.virtual('permissionCount').get(function () {
  return this.permissions ? this.permissions.length : 0;
});

// Method: Check if role has specific permission
roleSchema.methods.hasPermission = function (permissionKey) {
  if (!this.permissions || this.permissions.length === 0) {
    return false;
  }

  // If permissions are populated
  if (this.permissions[0].key) {
    return this.permissions.some((p) => p.key === permissionKey);
  }

  // If permissions are just IDs, need to query
  return false;
};

// Method: Add permission to role
roleSchema.methods.addPermission = async function (permissionId) {
  if (!this.permissions.includes(permissionId)) {
    this.permissions.push(permissionId);
    await this.save();
  }
  return this;
};

// Method: Remove permission from role
roleSchema.methods.removePermission = async function (permissionId) {
  this.permissions = this.permissions.filter(
    (p) => p.toString() !== permissionId.toString()
  );
  await this.save();
  return this;
};

// Method: Set permissions (replace all)
roleSchema.methods.setPermissions = async function (permissionIds) {
  this.permissions = permissionIds;
  await this.save();
  return this;
};

// Static method: Get system roles
roleSchema.statics.getSystemRoles = async function () {
  return await this.find({ isSystem: true, isActive: true }).populate('permissions');
};

// Static method: Get custom roles for organization
roleSchema.statics.getOrganizationRoles = async function (organizationId) {
  return await this.find({
    organizationId,
    isDeleted: false,
    isActive: true,
  }).populate('permissions');
};

// Static method: Get all roles for organization (system + custom)
roleSchema.statics.getAllForOrganization = async function (organizationId) {
  return await this.find({
    $or: [{ isSystem: true }, { organizationId }],
    isDeleted: false,
    isActive: true,
  })
    .populate('permissions')
    .sort({ level: -1, name: 1 });
};

// Static method: Seed default system roles
roleSchema.statics.seedSystemRoles = async function () {
  const Permission = mongoose.model('Permission');

  // Get all permissions
  const allPermissions = await Permission.find({ isActive: true }).select('_id key');

  // Helper: Get permission IDs by keys
  const getPermissionIds = (keys) => {
    return allPermissions.filter((p) => keys.includes(p.key)).map((p) => p._id);
  };

  // Helper: Get permissions by resource
  const getPermissionsByResource = (resources, actions = null) => {
    return allPermissions
      .filter((p) => {
        const resourceMatch = resources.includes(p.key.split('.')[0]);
        if (!actions) return resourceMatch;
        return resourceMatch && actions.includes(p.key.split('.')[1]);
      })
      .map((p) => p._id);
  };

  const systemRoles = [
    // ========================================
    // SUPER ADMIN - Full Access
    // ========================================
    {
      name: 'Super Admin',
      key: 'super_admin',
      description: 'Full system access with all permissions. Can manage all organizations and system settings.',
      isSystem: true,
      level: 100,
      color: '#DC2626',
      icon: 'ShieldCheckIcon',
      permissions: allPermissions.map((p) => p._id), // ALL PERMISSIONS
    },

    // ========================================
    // ADMIN - Organization Admin
    // ========================================
    {
      name: 'Admin',
      key: 'admin',
      description: 'Organization administrator with full access to organization data and settings.',
      isSystem: true,
      level: 90,
      color: '#EA580C',
      icon: 'UserShieldIcon',
      permissions: getPermissionIds([
        // User Management
        'users.view',
        'users.create',
        'users.edit',
        'users.delete',
        'users.manage',
        // Roles
        'roles.view',
        'roles.create',
        'roles.edit',
        'roles.delete',
        'roles.assign',
        'permissions.view',
        // Customers & Suppliers
        'customers.view',
        'customers.create',
        'customers.edit',
        'customers.delete',
        'customers.export',
        'suppliers.view',
        'suppliers.create',
        'suppliers.edit',
        'suppliers.delete',
        // Products & Services
        'products.view',
        'products.create',
        'products.edit',
        'products.delete',
        'services.view',
        'services.create',
        'services.edit',
        'services.delete',
        // Invoices
        'invoices.view',
        'invoices.create',
        'invoices.edit',
        'invoices.delete',
        'invoices.approve',
        'invoices.export',
        // Purchase Orders
        'purchase_orders.view',
        'purchase_orders.create',
        'purchase_orders.edit',
        'purchase_orders.delete',
        'purchase_orders.approve',
        // Payments & Expenses
        'payments.view',
        'payments.create',
        'payments.edit',
        'payments.delete',
        'payments.approve',
        'expenses.view',
        'expenses.create',
        'expenses.edit',
        'expenses.delete',
        // Accounting
        'accounts.view',
        'accounts.create',
        'accounts.edit',
        'accounts.delete',
        'journal_entries.view',
        'journal_entries.create',
        'journal_entries.edit',
        'journal_entries.delete',
        'ledger.view',
        // Reports & Settings
        'reports.view',
        'reports.export',
        'dashboard.view',
        'settings.view',
        'settings.edit',
        'organizations.manage',
        'audit_logs.view',
      ]),
    },

    // ========================================
    // MANAGER - Department Manager
    // ========================================
    {
      name: 'Manager',
      key: 'manager',
      description: 'Department manager with access to business operations and team management.',
      isSystem: true,
      level: 70,
      color: '#D97706',
      icon: 'BriefcaseIcon',
      permissions: getPermissionIds([
        // Limited User Management
        'users.view',
        'users.create',
        'users.edit',
        'roles.view',
        // Customers & Suppliers
        'customers.view',
        'customers.create',
        'customers.edit',
        'customers.export',
        'suppliers.view',
        'suppliers.create',
        'suppliers.edit',
        // Products & Services
        'products.view',
        'products.create',
        'products.edit',
        'services.view',
        'services.create',
        'services.edit',
        // Invoices
        'invoices.view',
        'invoices.create',
        'invoices.edit',
        'invoices.approve',
        'invoices.export',
        // Purchase Orders
        'purchase_orders.view',
        'purchase_orders.create',
        'purchase_orders.edit',
        'purchase_orders.approve',
        // Payments & Expenses
        'payments.view',
        'payments.create',
        'payments.edit',
        'expenses.view',
        'expenses.create',
        'expenses.edit',
        // Accounting (View Only)
        'accounts.view',
        'journal_entries.view',
        'ledger.view',
        // Reports
        'reports.view',
        'reports.export',
        'dashboard.view',
        'settings.view',
      ]),
    },

    // ========================================
    // ACCOUNTANT - Finance & Accounting
    // ========================================
    {
      name: 'Accountant',
      key: 'accountant',
      description: 'Finance and accounting specialist with access to financial records and reports.',
      isSystem: true,
      level: 60,
      color: '#059669',
      icon: 'CalculatorIcon',
      permissions: getPermissionIds([
        // Customers & Suppliers (View Only)
        'customers.view',
        'suppliers.view',
        // Invoices
        'invoices.view',
        'invoices.create',
        'invoices.edit',
        'invoices.export',
        // Purchase Orders
        'purchase_orders.view',
        'purchase_orders.create',
        'purchase_orders.edit',
        // Payments & Expenses (Full Access)
        'payments.view',
        'payments.create',
        'payments.edit',
        'payments.approve',
        'expenses.view',
        'expenses.create',
        'expenses.edit',
        // Accounting (Full Access)
        'accounts.view',
        'accounts.create',
        'accounts.edit',
        'journal_entries.view',
        'journal_entries.create',
        'journal_entries.edit',
        'ledger.view',
        // Reports
        'reports.view',
        'reports.export',
        'dashboard.view',
        'settings.view',
      ]),
    },

    // ========================================
    // SALES - Sales Representative
    // ========================================
    {
      name: 'Sales',
      key: 'sales',
      description: 'Sales representative with access to customer management and invoicing.',
      isSystem: true,
      level: 50,
      color: '#2563EB',
      icon: 'CurrencyDollarIcon',
      permissions: getPermissionIds([
        // Customers (Full Access)
        'customers.view',
        'customers.create',
        'customers.edit',
        'customers.export',
        // Products & Services (View/Edit)
        'products.view',
        'products.edit',
        'services.view',
        'services.edit',
        // Invoices
        'invoices.view',
        'invoices.create',
        'invoices.edit',
        'invoices.export',
        // Payments (View/Create)
        'payments.view',
        'payments.create',
        // Reports (Limited)
        'reports.view',
        'dashboard.view',
      ]),
    },

    // ========================================
    // USER - Basic User
    // ========================================
    {
      name: 'User',
      key: 'user',
      description: 'Basic user with limited access to view data and create basic records.',
      isSystem: true,
      level: 10,
      color: '#6B7280',
      icon: 'UserIcon',
      permissions: getPermissionIds([
        // Customers (View Only)
        'customers.view',
        // Products & Services (View Only)
        'products.view',
        'services.view',
        // Invoices (View Only)
        'invoices.view',
        // Dashboard
        'dashboard.view',
      ]),
    },
  ];

  // Use bulkWrite for better performance
  const bulkOps = systemRoles.map((role) => ({
    updateOne: {
      filter: { key: role.key },
      update: {
        $setOnInsert: {
          ...role,
          isSystem: true,
          organizationId: null,
        },
      },
      upsert: true,
    },
  }));

  const result = await this.bulkWrite(bulkOps);
  return result;
};

// Pre-save hook: Validate system role modifications
roleSchema.pre('save', function (next) {
  if (this.isSystem && this.isModified() && !this.isNew) {
    // Allow only certain fields to be modified for system roles
    const modifiedFields = this.modifiedPaths();
    const allowedFields = ['isActive', 'userCount'];

    const hasRestrictedModification = modifiedFields.some(
      (field) => !allowedFields.includes(field)
    );

    if (hasRestrictedModification) {
      return next(new Error('System roles cannot be modified'));
    }
  }

  next();
});

// Pre-delete hook: Prevent system role deletion
roleSchema.pre('deleteOne', { document: true, query: false }, function (next) {
  if (this.isSystem) {
    return next(new Error('System roles cannot be deleted'));
  }
  next();
});

const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);

export default Role;
