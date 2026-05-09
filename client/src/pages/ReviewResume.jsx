import { FileText, Sparkles } from 'lucide-react'
import React, { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Markdown from 'react-markdown'

const ReviewResume = () => {
  const [input, setInput] = useState(null)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const token = await getToken()
      const formData = new FormData()
      formData.append('resume', input)

      const { data } = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/ai/resume-review`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        setContent(data.content)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
        <div className='flex items-center gap-2'>
          <Sparkles className='w-6 text-[#00DA83]' />
          <h1 className='text-xl font-semibold'>Resume Review</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Upload Resume</p>
        <input
          onChange={(e) => setInput(e.target.files[0])} type="file" accept='application/pdf'
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600' required />
        <p className='text-xs text-gray-500 font-light mt-1'>Support PDF resume only</p>

        <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#00DA83] to-[#009BB3] text-white px-4 py-2 mt-6 text-sm rounded-lg disabled:opacity-60'>
          <FileText className='w-5' />
          {loading ? 'Reviewing...' : 'Review Resume'}
        </button>
      </form>

      <div className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 min-h-96 max-h-[600px] overflow-hidden flex flex-col'>
        <div className='flex items-center gap-3 shrink-0'>
          <FileText className='w-5 h-5 text-[#00DA83]' />
          <h1 className='text-xl font-semibold'>Analysis Result</h1>
        </div>
        <div className='mt-4 overflow-y-auto flex-1'>
          {content ? (
            <div className='reset-tw text-sm text-slate-700 w-full'>
              <Markdown>{content}</Markdown>
            </div>
          ) : (
            <div className='h-full flex flex-col justify-center items-center gap-5 text-gray-400 text-sm'>
              <FileText className='w-9 h-9' />
              <p>Upload a resume and click "Review Resume" to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewResume