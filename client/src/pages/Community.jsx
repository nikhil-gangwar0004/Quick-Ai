import { useUser, useAuth } from '@clerk/clerk-react'
import React, { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const Community = () => {
  const [creations, setCreations] = useState([])
  const { user } = useUser()
  const { getToken } = useAuth()

  const fetchCreations = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/user/get-published-creations`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        setCreations(data.creations)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const toggleLike = async (id) => {
    try {
      const token = await getToken()
      const { data } = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/user/toggle-like-creations`,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        fetchCreations()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (user) fetchCreations()
  }, [user])

  return (
    <div className='flex-1 h-full flex flex-col gap-4 p-6'>
      <p className='text-slate-700 font-medium'>Community Creations</p>
      <div className='bg-white h-full w-full rounded-xl overflow-y-scroll'>
        {creations.length === 0 ? (
          <div className='h-full flex justify-center items-center text-gray-400 text-sm'>
            No published creations yet.
          </div>
        ) : (
          <div className='flex flex-wrap'>
            {creations.map((creation, index) => (
              <div key={index} className='relative group inline-block pl-3 pt-3 w-full sm:w-1/2 lg:w-1/3'>
                <img src={creation.content} alt="" className='w-full h-full object-cover rounded-lg' />
                <div className='absolute bottom-0 top-0 right-0 left-3 flex gap-2 items-end justify-end group-hover:justify-between p-3 group-hover:bg-linear-to-b from-transparent to-black/80 text-white rounded-lg'>
                  <p className='text-sm hidden group-hover:block'>{creation.prompt}</p>
                  <div className='flex gap-1 items-center cursor-pointer' onClick={() => toggleLike(creation.id)}>
                    <p>{creation.likes.length}</p>
                    <Heart className={`w-5 h-5 hover:scale-110 transition ${creation.likes.includes(user?.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Community