import { Scissors, Sparkles } from 'lucide-react'
import React from 'react'

const RemoveObject = () => {
  return (
    <div className='h-full overflow-y-scroll p-6 flex items-center justify-center text-slate-700'>
      <div className='text-center p-12 bg-white rounded-lg border border-gray-200 max-w-md'>
        <div className='flex justify-center mb-4'>
          <Scissors className='w-16 h-16 text-[#4A7AFF] opacity-40' />
        </div>
        <h1 className='text-2xl font-semibold mb-3'>Object Removal</h1>
        <span className='bg-blue-50 text-blue-600 text-xs font-medium px-4 py-1.5 rounded-full border border-blue-200'>
          Coming Soon
        </span>
        <p className='text-gray-400 text-sm mt-4'>
          We are working hard to bring you AI-powered object removal. Stay tuned!
        </p>
      </div>
    </div>
  )
}

export default RemoveObject