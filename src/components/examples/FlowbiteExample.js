'use client';

import { useState } from 'react';
import {
  Button,
  Modal,
  Dropdown,
  Card,
  Badge,
  Alert,
  Toast,
  Tabs,
  TextInput,
  Label,
  Spinner,
  Avatar,
  Table,
} from 'flowbite-react';
import {
  HiCheck,
  HiX,
  HiExclamation,
  HiInformationCircle,
  HiOutlineCog,
  HiOutlineUserCircle,
  HiOutlineLogout,
} from 'react-icons/hi';

/**
 * Flowbite React Component Library Examples
 *
 * Benefits:
 * - Pre-built Tailwind components
 * - Consistent design system
 * - Full accessibility support
 * - No custom CSS needed
 * - Works seamlessly with existing Tailwind setup
 */
export default function FlowbiteExample() {
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Flowbite React Components
        </h2>
        <p className="text-gray-600 mb-6">
          Pre-built, accessible Tailwind components for professional UI
        </p>
      </div>

      {/* Buttons Section */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Buttons
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button color="blue">Primary Action</Button>
          <Button color="gray">Secondary</Button>
          <Button color="success">
            <HiCheck className="mr-2 h-5 w-5" />
            Success
          </Button>
          <Button color="failure">
            <HiX className="mr-2 h-5 w-5" />
            Danger
          </Button>
          <Button color="warning">Warning</Button>
          <Button outline gradientDuoTone="purpleToBlue">
            Gradient
          </Button>
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
          <Button isProcessing>Loading...</Button>
        </div>
      </Card>

      {/* Modal Section */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Modals & Dialogs
        </h3>
        <Button onClick={() => setShowModal(true)}>
          Open Modal
        </Button>

        <Modal show={showModal} onClose={() => setShowModal(false)}>
          <Modal.Header>Create New Invoice</Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer">Customer</Label>
                <TextInput
                  id="customer"
                  placeholder="Select customer..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <TextInput
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  required
                />
              </div>
              <Alert color="info" icon={HiInformationCircle}>
                This invoice will be created in the current fiscal year.
              </Alert>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => setShowModal(false)}>Create Invoice</Button>
            <Button color="gray" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        <div className="mt-4 bg-blue-50 p-3 rounded text-xs text-blue-800">
          <p className="font-semibold mb-1">✓ Benefits:</p>
          <ul className="space-y-1">
            <li>• Pre-styled modal with backdrop</li>
            <li>• Accessibility built-in (focus trap, ESC key)</li>
            <li>• No manual z-index management</li>
            <li>• Consistent across application</li>
          </ul>
        </div>
      </Card>

      {/* Dropdown Section */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Dropdowns
        </h3>
        <div className="flex flex-wrap gap-3">
          <Dropdown label="Actions">
            <Dropdown.Item>Edit</Dropdown.Item>
            <Dropdown.Item>Delete</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item>Export</Dropdown.Item>
          </Dropdown>

          <Dropdown label="User Profile" dismissOnClick={false}>
            <Dropdown.Header>
              <span className="block text-sm">John Doe</span>
              <span className="block truncate text-sm font-medium">
                john@example.com
              </span>
            </Dropdown.Header>
            <Dropdown.Item icon={HiOutlineUserCircle}>
              Profile
            </Dropdown.Item>
            <Dropdown.Item icon={HiOutlineCog}>
              Settings
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item icon={HiOutlineLogout}>
              Sign out
            </Dropdown.Item>
          </Dropdown>

          <Dropdown
            label="Status"
            dismissOnClick={false}
            renderTrigger={() => (
              <Button>
                <Badge color="success" className="mr-2">
                  Active
                </Badge>
                Change Status
              </Button>
            )}
          >
            <Dropdown.Item>
              <Badge color="success">Active</Badge>
            </Dropdown.Item>
            <Dropdown.Item>
              <Badge color="warning">Pending</Badge>
            </Dropdown.Item>
            <Dropdown.Item>
              <Badge color="failure">Inactive</Badge>
            </Dropdown.Item>
          </Dropdown>
        </div>
      </Card>

      {/* Badges Section */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Badges & Status Indicators
        </h3>
        <div className="flex flex-wrap gap-2">
          <Badge color="info">Draft</Badge>
          <Badge color="warning">Pending</Badge>
          <Badge color="success">Approved</Badge>
          <Badge color="failure">Rejected</Badge>
          <Badge color="indigo">Posted</Badge>
          <Badge color="purple">Archived</Badge>
          <Badge size="sm">Small</Badge>
          <Badge icon={HiCheck}>With Icon</Badge>
        </div>
      </Card>

      {/* Alerts Section */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Alerts
        </h3>
        <div className="space-y-3">
          <Alert color="info" icon={HiInformationCircle}>
            <span className="font-medium">Info!</span> This is an informational message.
          </Alert>
          <Alert color="success" icon={HiCheck}>
            <span className="font-medium">Success!</span> Invoice created successfully.
          </Alert>
          <Alert color="warning" icon={HiExclamation}>
            <span className="font-medium">Warning!</span> Payment is overdue.
          </Alert>
          <Alert color="failure" icon={HiX}>
            <span className="font-medium">Error!</span> Failed to save changes.
          </Alert>
          <Alert color="success" onDismiss={() => alert('Alert dismissed!')}>
            <span className="font-medium">Dismissible!</span> Click X to dismiss.
          </Alert>
        </div>
      </Card>

      {/* Toast Notification */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Toast Notifications
        </h3>
        <Button onClick={() => setShowToast(true)}>
          Show Toast
        </Button>

        {showToast && (
          <div className="fixed bottom-4 right-4 z-50">
            <Toast>
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">
                <HiCheck className="h-5 w-5" />
              </div>
              <div className="ml-3 text-sm font-normal">
                Item saved successfully.
              </div>
              <Toast.Toggle onDismiss={() => setShowToast(false)} />
            </Toast>
          </div>
        )}
      </Card>

      {/* Tabs Section */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tabs
        </h3>
        <Tabs aria-label="Example tabs">
          <Tabs.Item active title="Invoice Details">
            <div className="p-4">
              <h4 className="font-semibold mb-2">Invoice Information</h4>
              <p className="text-sm text-gray-600">
                Invoice number, date, customer details, and line items.
              </p>
            </div>
          </Tabs.Item>
          <Tabs.Item title="Payments">
            <div className="p-4">
              <h4 className="font-semibold mb-2">Payment History</h4>
              <p className="text-sm text-gray-600">
                Track all payments received for this invoice.
              </p>
            </div>
          </Tabs.Item>
          <Tabs.Item title="Activity">
            <div className="p-4">
              <h4 className="font-semibold mb-2">Activity Log</h4>
              <p className="text-sm text-gray-600">
                View all actions performed on this invoice.
              </p>
            </div>
          </Tabs.Item>
          <Tabs.Item disabled title="Documents">
            Disabled tab
          </Tabs.Item>
        </Tabs>
      </Card>

      {/* Form Inputs */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Form Inputs
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <TextInput
              id="email"
              type="email"
              placeholder="name@company.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount (PKR)</Label>
            <TextInput
              id="amount"
              type="number"
              placeholder="0.00"
              helperText="Enter amount in Pakistani Rupees"
            />
          </div>
          <div>
            <Label htmlFor="success">Success Input</Label>
            <TextInput
              id="success"
              color="success"
              placeholder="Valid input"
            />
          </div>
          <div>
            <Label htmlFor="error">Error Input</Label>
            <TextInput
              id="error"
              color="failure"
              placeholder="Invalid input"
              helperText="This field is required"
            />
          </div>
        </div>
      </Card>

      {/* Table Section */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tables
        </h3>
        <Table striped>
          <Table.Head>
            <Table.HeadCell>Invoice #</Table.HeadCell>
            <Table.HeadCell>Customer</Table.HeadCell>
            <Table.HeadCell>Amount</Table.HeadCell>
            <Table.HeadCell>Status</Table.HeadCell>
            <Table.HeadCell>
              <span className="sr-only">Actions</span>
            </Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            <Table.Row className="bg-white">
              <Table.Cell className="font-medium text-gray-900">
                INV-001
              </Table.Cell>
              <Table.Cell>John Doe</Table.Cell>
              <Table.Cell>PKR 50,000</Table.Cell>
              <Table.Cell>
                <Badge color="success">Paid</Badge>
              </Table.Cell>
              <Table.Cell>
                <a href="#" className="font-medium text-blue-600 hover:underline">
                  View
                </a>
              </Table.Cell>
            </Table.Row>
            <Table.Row className="bg-white">
              <Table.Cell className="font-medium text-gray-900">
                INV-002
              </Table.Cell>
              <Table.Cell>Jane Smith</Table.Cell>
              <Table.Cell>PKR 75,000</Table.Cell>
              <Table.Cell>
                <Badge color="warning">Pending</Badge>
              </Table.Cell>
              <Table.Cell>
                <a href="#" className="font-medium text-blue-600 hover:underline">
                  View
                </a>
              </Table.Cell>
            </Table.Row>
            <Table.Row className="bg-white">
              <Table.Cell className="font-medium text-gray-900">
                INV-003
              </Table.Cell>
              <Table.Cell>ABC Corp</Table.Cell>
              <Table.Cell>PKR 1,25,000</Table.Cell>
              <Table.Cell>
                <Badge color="failure">Overdue</Badge>
              </Table.Cell>
              <Table.Cell>
                <a href="#" className="font-medium text-blue-600 hover:underline">
                  View
                </a>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Card>

      {/* Avatars & Spinners */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Avatars & Loading States
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Avatars:</p>
            <div className="flex gap-2">
              <Avatar rounded />
              <Avatar img="https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff" rounded />
              <Avatar placeholderInitials="JD" rounded />
              <Avatar size="xs" rounded />
              <Avatar size="sm" rounded />
              <Avatar size="lg" rounded />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Spinners:</p>
            <div className="flex gap-2">
              <Spinner size="xs" />
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
              <Spinner color="success" />
              <Spinner color="failure" />
            </div>
          </div>
        </div>
      </Card>

      {/* Comparison: Before vs After */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Before vs After Comparison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">
              ❌ Before (Manual Components)
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Custom CSS for every component</li>
              <li>• Inconsistent styling</li>
              <li>• No accessibility (focus, ARIA)</li>
              <li>• Manual state management</li>
              <li>• Hard to maintain</li>
              <li>• Time-consuming development</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">
              ✅ After (Flowbite React)
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Pre-built components</li>
              <li>• Consistent design system</li>
              <li>• Full accessibility support</li>
              <li>• State handled automatically</li>
              <li>• Easy to maintain</li>
              <li>• 10x faster development</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Code Example */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Usage Example
        </h3>
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
          <code>{`// Import components
import { Button, Modal, Alert, Badge } from 'flowbite-react';

// Use in your component
function InvoiceForm() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        Create Invoice
      </Button>

      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <Modal.Header>New Invoice</Modal.Header>
        <Modal.Body>
          <Alert color="info">
            Fill in the invoice details below.
          </Alert>
          {/* Your form fields */}
        </Modal.Body>
        <Modal.Footer>
          <Button>Save</Button>
          <Button color="gray" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}`}</code>
        </pre>
      </Card>

      {/* Use Cases for DigiInvoice ERP */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Perfect Use Cases in DigiInvoice ERP
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Modals:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Create/Edit Invoice</li>
              <li>• Add Customer/Supplier</li>
              <li>• Create Journal Voucher</li>
              <li>• Confirm Delete Actions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Dropdowns:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• User profile menu</li>
              <li>• Quick actions menu</li>
              <li>• Status change</li>
              <li>• Fiscal year selection</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Badges:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Invoice status (Paid/Pending)</li>
              <li>• Payment status</li>
              <li>• User roles</li>
              <li>• Transaction types</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Alerts:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Validation errors</li>
              <li>• Success messages</li>
              <li>• Warning notifications</li>
              <li>• Info messages</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
