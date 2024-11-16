import { PrismaClient } from '@prisma/client';

async function getInvoices() {
  const prisma = new PrismaClient();
  return await prisma.invoice.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });
}

export default async function InvoiceList() {
  const invoices = await getInvoices();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment Link
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                ${invoice.amount.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {invoice.clientEmail}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                    invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'}`}>
                  {invoice.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(invoice.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {invoice.paymentLink && (
                  <a
                    href={invoice.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}