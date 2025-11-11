import mongoose from 'mongoose';

/**
 * Permission Model
 * Defines fine-grained permissions for RBAC system
 *
 * Permission Format: resource.action
 * Examples: users.view, invoices.create, reports.export
 */

const permissionSchema = new mongoose.Schema(
  {
    // Unique permission key (e.g., "users.create")
    key: {
      type: String,
      required: [true, 'Permission key is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z_]+\.[a-z_]+$/, 'Permission key must be in format: resource.action'],
    },

    // Human-readable name
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      trim: true,
    },

    // Description of what this permission allows
    description: {
      type: String,
      trim: true,
    },

    // Resource category (users, invoices, customers, etc.)
    resource: {
      type: String,
      required: [true, 'Resource is required'],
      trim: true,
      lowercase: true,
      enum: [
        'users',
        'roles',
        'permissions',
        'organizations',
        'customers',
        'suppliers',
        'products',
        'services',
        'invoices',
        'purchase_orders',
        'payments',
        'expenses',
        'accounts',
        'journal_entries',
        'ledger',
        'reports',
        'settings',
        'dashboard',
        'audit_logs',
      ],
    },

    // Action type (view, create, edit, delete, etc.)
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      lowercase: true,
      enum: [
        'view',        // Read/view resource
        'create',      // Create new resource
        'edit',        // Update existing resource
        'delete',      // Delete resource
        'manage',      // Full access (all actions)
        'export',      // Export data
        'import',      // Import data
        'approve',     // Approve/reject actions
        'assign',      // Assign to others
      ],
    },

    // Permission category for UI grouping
    category: {
      type: String,
      required: true,
      enum: [
        'User Management',
        'Customer Management',
        'Supplier Management',
        'Inventory Management',
        'Sales & Invoicing',
        'Purchases',
        'Payments & Banking',
        'Accounting & Finance',
        'Reports & Analytics',
        'System Settings',
      ],
    },

    // Is this a system permission (cannot be deleted)
    isSystem: {
      type: Boolean,
      default: true,
    },

    // Is this permission active
    isActive: {
      type: Boolean,
      default: true,
    },

    // Display order for UI
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
permissionSchema.index({ key: 1 });
permissionSchema.index({ resource: 1, action: 1 });
permissionSchema.index({ category: 1 });
permissionSchema.index({ isActive: 1 });

// Virtual: Full display name
permissionSchema.virtual('fullName').get(function () {
  return `${this.resource}.${this.action}`;
});

// Static method: Get all permissions grouped by category
permissionSchema.statics.getAllGrouped = async function () {
  const permissions = await this.find({ isActive: true }).sort({ category: 1, displayOrder: 1 });

  const grouped = {};
  permissions.forEach((permission) => {
    if (!grouped[permission.category]) {
      grouped[permission.category] = [];
    }
    grouped[permission.category].push(permission);
  });

  return grouped;
};

// Static method: Get permissions by resource
permissionSchema.statics.getByResource = async function (resource) {
  return await this.find({ resource, isActive: true }).sort({ displayOrder: 1 });
};

// Static method: Check if permission key exists
permissionSchema.statics.exists = async function (key) {
  const count = await this.countDocuments({ key, isActive: true });
  return count > 0;
};

// Static method: Seed default permissions
permissionSchema.statics.seedPermissions = async function () {
  const defaultPermissions = [
    // ========================================
    // USER MANAGEMENT
    // ========================================
    {
      key: 'users.view',
      name: 'View Users',
      description: 'View user list and user details',
      resource: 'users',
      action: 'view',
      category: 'User Management',
      displayOrder: 1,
    },
    {
      key: 'users.create',
      name: 'Create Users',
      description: 'Add new users to the organization',
      resource: 'users',
      action: 'create',
      category: 'User Management',
      displayOrder: 2,
    },
    {
      key: 'users.edit',
      name: 'Edit Users',
      description: 'Update user information and settings',
      resource: 'users',
      action: 'edit',
      category: 'User Management',
      displayOrder: 3,
    },
    {
      key: 'users.delete',
      name: 'Delete Users',
      description: 'Remove users from the organization',
      resource: 'users',
      action: 'delete',
      category: 'User Management',
      displayOrder: 4,
    },
    {
      key: 'users.manage',
      name: 'Manage Users',
      description: 'Full access to user management',
      resource: 'users',
      action: 'manage',
      category: 'User Management',
      displayOrder: 5,
    },

    // ========================================
    // ROLES & PERMISSIONS
    // ========================================
    {
      key: 'roles.view',
      name: 'View Roles',
      description: 'View roles and their permissions',
      resource: 'roles',
      action: 'view',
      category: 'User Management',
      displayOrder: 10,
    },
    {
      key: 'roles.create',
      name: 'Create Roles',
      description: 'Create custom roles',
      resource: 'roles',
      action: 'create',
      category: 'User Management',
      displayOrder: 11,
    },
    {
      key: 'roles.edit',
      name: 'Edit Roles',
      description: 'Update roles and assign permissions',
      resource: 'roles',
      action: 'edit',
      category: 'User Management',
      displayOrder: 12,
    },
    {
      key: 'roles.delete',
      name: 'Delete Roles',
      description: 'Remove custom roles',
      resource: 'roles',
      action: 'delete',
      category: 'User Management',
      displayOrder: 13,
    },
    {
      key: 'roles.assign',
      name: 'Assign Roles',
      description: 'Assign roles to users',
      resource: 'roles',
      action: 'assign',
      category: 'User Management',
      displayOrder: 14,
    },

    {
      key: 'permissions.view',
      name: 'View Permissions',
      description: 'View all system permissions',
      resource: 'permissions',
      action: 'view',
      category: 'User Management',
      displayOrder: 15,
    },
    {
      key: 'permissions.manage',
      name: 'Manage Permissions',
      description: 'Full access to permissions management',
      resource: 'permissions',
      action: 'manage',
      category: 'User Management',
      displayOrder: 16,
    },

    // ========================================
    // CUSTOMER MANAGEMENT
    // ========================================
    {
      key: 'customers.view',
      name: 'View Customers',
      description: 'View customer list and details',
      resource: 'customers',
      action: 'view',
      category: 'Customer Management',
      displayOrder: 20,
    },
    {
      key: 'customers.create',
      name: 'Create Customers',
      description: 'Add new customers',
      resource: 'customers',
      action: 'create',
      category: 'Customer Management',
      displayOrder: 21,
    },
    {
      key: 'customers.edit',
      name: 'Edit Customers',
      description: 'Update customer information',
      resource: 'customers',
      action: 'edit',
      category: 'Customer Management',
      displayOrder: 22,
    },
    {
      key: 'customers.delete',
      name: 'Delete Customers',
      description: 'Remove customers',
      resource: 'customers',
      action: 'delete',
      category: 'Customer Management',
      displayOrder: 23,
    },
    {
      key: 'customers.export',
      name: 'Export Customers',
      description: 'Export customer data',
      resource: 'customers',
      action: 'export',
      category: 'Customer Management',
      displayOrder: 24,
    },

    // ========================================
    // SUPPLIER MANAGEMENT
    // ========================================
    {
      key: 'suppliers.view',
      name: 'View Suppliers',
      description: 'View supplier list and details',
      resource: 'suppliers',
      action: 'view',
      category: 'Supplier Management',
      displayOrder: 30,
    },
    {
      key: 'suppliers.create',
      name: 'Create Suppliers',
      description: 'Add new suppliers',
      resource: 'suppliers',
      action: 'create',
      category: 'Supplier Management',
      displayOrder: 31,
    },
    {
      key: 'suppliers.edit',
      name: 'Edit Suppliers',
      description: 'Update supplier information',
      resource: 'suppliers',
      action: 'edit',
      category: 'Supplier Management',
      displayOrder: 32,
    },
    {
      key: 'suppliers.delete',
      name: 'Delete Suppliers',
      description: 'Remove suppliers',
      resource: 'suppliers',
      action: 'delete',
      category: 'Supplier Management',
      displayOrder: 33,
    },

    // ========================================
    // PRODUCTS & SERVICES
    // ========================================
    {
      key: 'products.view',
      name: 'View Products',
      description: 'View product catalog',
      resource: 'products',
      action: 'view',
      category: 'Inventory Management',
      displayOrder: 40,
    },
    {
      key: 'products.create',
      name: 'Create Products',
      description: 'Add new products',
      resource: 'products',
      action: 'create',
      category: 'Inventory Management',
      displayOrder: 41,
    },
    {
      key: 'products.edit',
      name: 'Edit Products',
      description: 'Update product information',
      resource: 'products',
      action: 'edit',
      category: 'Inventory Management',
      displayOrder: 42,
    },
    {
      key: 'products.delete',
      name: 'Delete Products',
      description: 'Remove products',
      resource: 'products',
      action: 'delete',
      category: 'Inventory Management',
      displayOrder: 43,
    },

    {
      key: 'services.view',
      name: 'View Services',
      description: 'View service catalog',
      resource: 'services',
      action: 'view',
      category: 'Inventory Management',
      displayOrder: 45,
    },
    {
      key: 'services.create',
      name: 'Create Services',
      description: 'Add new services',
      resource: 'services',
      action: 'create',
      category: 'Inventory Management',
      displayOrder: 46,
    },
    {
      key: 'services.edit',
      name: 'Edit Services',
      description: 'Update service information',
      resource: 'services',
      action: 'edit',
      category: 'Inventory Management',
      displayOrder: 47,
    },
    {
      key: 'services.delete',
      name: 'Delete Services',
      description: 'Remove services',
      resource: 'services',
      action: 'delete',
      category: 'Inventory Management',
      displayOrder: 48,
    },

    // ========================================
    // INVOICES
    // ========================================
    {
      key: 'invoices.view',
      name: 'View Invoices',
      description: 'View all invoices',
      resource: 'invoices',
      action: 'view',
      category: 'Sales & Invoicing',
      displayOrder: 50,
    },
    {
      key: 'invoices.create',
      name: 'Create Invoices',
      description: 'Create new invoices',
      resource: 'invoices',
      action: 'create',
      category: 'Sales & Invoicing',
      displayOrder: 51,
    },
    {
      key: 'invoices.edit',
      name: 'Edit Invoices',
      description: 'Update invoice details',
      resource: 'invoices',
      action: 'edit',
      category: 'Sales & Invoicing',
      displayOrder: 52,
    },
    {
      key: 'invoices.delete',
      name: 'Delete Invoices',
      description: 'Delete invoices',
      resource: 'invoices',
      action: 'delete',
      category: 'Sales & Invoicing',
      displayOrder: 53,
    },
    {
      key: 'invoices.approve',
      name: 'Approve Invoices',
      description: 'Approve/reject invoices',
      resource: 'invoices',
      action: 'approve',
      category: 'Sales & Invoicing',
      displayOrder: 54,
    },
    {
      key: 'invoices.export',
      name: 'Export Invoices',
      description: 'Export invoice data',
      resource: 'invoices',
      action: 'export',
      category: 'Sales & Invoicing',
      displayOrder: 55,
    },

    // ========================================
    // PURCHASE ORDERS
    // ========================================
    {
      key: 'purchase_orders.view',
      name: 'View Purchase Orders',
      description: 'View all purchase orders',
      resource: 'purchase_orders',
      action: 'view',
      category: 'Purchases',
      displayOrder: 60,
    },
    {
      key: 'purchase_orders.create',
      name: 'Create Purchase Orders',
      description: 'Create new purchase orders',
      resource: 'purchase_orders',
      action: 'create',
      category: 'Purchases',
      displayOrder: 61,
    },
    {
      key: 'purchase_orders.edit',
      name: 'Edit Purchase Orders',
      description: 'Update purchase order details',
      resource: 'purchase_orders',
      action: 'edit',
      category: 'Purchases',
      displayOrder: 62,
    },
    {
      key: 'purchase_orders.delete',
      name: 'Delete Purchase Orders',
      description: 'Delete purchase orders',
      resource: 'purchase_orders',
      action: 'delete',
      category: 'Purchases',
      displayOrder: 63,
    },
    {
      key: 'purchase_orders.approve',
      name: 'Approve Purchase Orders',
      description: 'Approve/reject purchase orders',
      resource: 'purchase_orders',
      action: 'approve',
      category: 'Purchases',
      displayOrder: 64,
    },

    // ========================================
    // PAYMENTS
    // ========================================
    {
      key: 'payments.view',
      name: 'View Payments',
      description: 'View payment records',
      resource: 'payments',
      action: 'view',
      category: 'Payments & Banking',
      displayOrder: 70,
    },
    {
      key: 'payments.create',
      name: 'Record Payments',
      description: 'Record new payments',
      resource: 'payments',
      action: 'create',
      category: 'Payments & Banking',
      displayOrder: 71,
    },
    {
      key: 'payments.edit',
      name: 'Edit Payments',
      description: 'Update payment records',
      resource: 'payments',
      action: 'edit',
      category: 'Payments & Banking',
      displayOrder: 72,
    },
    {
      key: 'payments.delete',
      name: 'Delete Payments',
      description: 'Delete payment records',
      resource: 'payments',
      action: 'delete',
      category: 'Payments & Banking',
      displayOrder: 73,
    },
    {
      key: 'payments.approve',
      name: 'Approve Payments',
      description: 'Approve/reject payments',
      resource: 'payments',
      action: 'approve',
      category: 'Payments & Banking',
      displayOrder: 74,
    },

    // ========================================
    // EXPENSES
    // ========================================
    {
      key: 'expenses.view',
      name: 'View Expenses',
      description: 'View expense records',
      resource: 'expenses',
      action: 'view',
      category: 'Payments & Banking',
      displayOrder: 80,
    },
    {
      key: 'expenses.create',
      name: 'Create Expenses',
      description: 'Record new expenses',
      resource: 'expenses',
      action: 'create',
      category: 'Payments & Banking',
      displayOrder: 81,
    },
    {
      key: 'expenses.edit',
      name: 'Edit Expenses',
      description: 'Update expense records',
      resource: 'expenses',
      action: 'edit',
      category: 'Payments & Banking',
      displayOrder: 82,
    },
    {
      key: 'expenses.delete',
      name: 'Delete Expenses',
      description: 'Delete expense records',
      resource: 'expenses',
      action: 'delete',
      category: 'Payments & Banking',
      displayOrder: 83,
    },

    // ========================================
    // ACCOUNTING
    // ========================================
    {
      key: 'accounts.view',
      name: 'View Accounts',
      description: 'View chart of accounts',
      resource: 'accounts',
      action: 'view',
      category: 'Accounting & Finance',
      displayOrder: 90,
    },
    {
      key: 'accounts.create',
      name: 'Create Accounts',
      description: 'Create new accounts',
      resource: 'accounts',
      action: 'create',
      category: 'Accounting & Finance',
      displayOrder: 91,
    },
    {
      key: 'accounts.edit',
      name: 'Edit Accounts',
      description: 'Update account details',
      resource: 'accounts',
      action: 'edit',
      category: 'Accounting & Finance',
      displayOrder: 92,
    },
    {
      key: 'accounts.delete',
      name: 'Delete Accounts',
      description: 'Delete accounts',
      resource: 'accounts',
      action: 'delete',
      category: 'Accounting & Finance',
      displayOrder: 93,
    },

    {
      key: 'journal_entries.view',
      name: 'View Journal Entries',
      description: 'View journal entries',
      resource: 'journal_entries',
      action: 'view',
      category: 'Accounting & Finance',
      displayOrder: 95,
    },
    {
      key: 'journal_entries.create',
      name: 'Create Journal Entries',
      description: 'Create new journal entries',
      resource: 'journal_entries',
      action: 'create',
      category: 'Accounting & Finance',
      displayOrder: 96,
    },
    {
      key: 'journal_entries.edit',
      name: 'Edit Journal Entries',
      description: 'Update journal entries',
      resource: 'journal_entries',
      action: 'edit',
      category: 'Accounting & Finance',
      displayOrder: 97,
    },
    {
      key: 'journal_entries.delete',
      name: 'Delete Journal Entries',
      description: 'Delete journal entries',
      resource: 'journal_entries',
      action: 'delete',
      category: 'Accounting & Finance',
      displayOrder: 98,
    },

    {
      key: 'ledger.view',
      name: 'View Ledger',
      description: 'View general ledger',
      resource: 'ledger',
      action: 'view',
      category: 'Accounting & Finance',
      displayOrder: 100,
    },

    // ========================================
    // REPORTS
    // ========================================
    {
      key: 'reports.view',
      name: 'View Reports',
      description: 'Access all reports',
      resource: 'reports',
      action: 'view',
      category: 'Reports & Analytics',
      displayOrder: 110,
    },
    {
      key: 'reports.export',
      name: 'Export Reports',
      description: 'Export reports to PDF/Excel',
      resource: 'reports',
      action: 'export',
      category: 'Reports & Analytics',
      displayOrder: 111,
    },

    // ========================================
    // DASHBOARD
    // ========================================
    {
      key: 'dashboard.view',
      name: 'View Dashboard',
      description: 'Access dashboard and analytics',
      resource: 'dashboard',
      action: 'view',
      category: 'Reports & Analytics',
      displayOrder: 115,
    },

    // ========================================
    // SETTINGS
    // ========================================
    {
      key: 'settings.view',
      name: 'View Settings',
      description: 'View system settings',
      resource: 'settings',
      action: 'view',
      category: 'System Settings',
      displayOrder: 120,
    },
    {
      key: 'settings.edit',
      name: 'Edit Settings',
      description: 'Update system settings',
      resource: 'settings',
      action: 'edit',
      category: 'System Settings',
      displayOrder: 121,
    },

    {
      key: 'organizations.manage',
      name: 'Manage Organization',
      description: 'Full access to organization settings',
      resource: 'organizations',
      action: 'manage',
      category: 'System Settings',
      displayOrder: 125,
    },

    // ========================================
    // AUDIT LOGS
    // ========================================
    {
      key: 'audit_logs.view',
      name: 'View Audit Logs',
      description: 'View system audit logs',
      resource: 'audit_logs',
      action: 'view',
      category: 'System Settings',
      displayOrder: 130,
    },
  ];

  // Use bulkWrite for better performance
  const bulkOps = defaultPermissions.map((perm) => ({
    updateOne: {
      filter: { key: perm.key },
      update: { $setOnInsert: perm },
      upsert: true,
    },
  }));

  const result = await this.bulkWrite(bulkOps);
  return result;
};

const Permission = mongoose.models.Permission || mongoose.model('Permission', permissionSchema);

export default Permission;
