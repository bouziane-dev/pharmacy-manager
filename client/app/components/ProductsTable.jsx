// ProductsTable.jsx
'use client'
import React from 'react'

const ProductsTable = () => {
  const products = [
    { name: 'Paracetamol', stock: 50 },
    { name: 'Ibuprofen', stock: 20 },
    { name: 'Amoxicillin', stock: 15 }
  ]

  return (
    <div className='mt-8 overflow-x-auto rounded-xl bg-white p-4 shadow dark:bg-slate-800'>
      <h3 className='mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100'>
        Produits
      </h3>
      <table className='min-w-full text-left'>
        <thead>
          <tr className='border-b border-slate-200 dark:border-slate-700'>
            <th className='px-4 py-2 text-slate-700 dark:text-slate-300'>
              Nom
            </th>
            <th className='px-4 py-2 text-slate-700 dark:text-slate-300'>
              Stock
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr
              key={i}
              className='transition hover:bg-green-50 dark:hover:bg-slate-700'
            >
              <td className='px-4 py-2 text-slate-800 dark:text-slate-100'>
                {p.name}
              </td>
              <td className='px-4 py-2 text-slate-800 dark:text-slate-100'>
                {p.stock}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ProductsTable
