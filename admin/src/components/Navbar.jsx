import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AdminContext } from '../context/AdminContext'
import { DoctorContext } from '../context/DoctorContext'

const Navbar = () => {

    const navigate = useNavigate()

    const {aToken, setAToken} = useContext(AdminContext)
    const {dToken, setDToken} = useContext(DoctorContext)

    const logout = () => {
        if (aToken) {
            setAToken('');
            localStorage.removeItem('aToken');
            navigate('/login');
        }
        if (dToken) {
            setDToken('');
            localStorage.removeItem('dToken');
            navigate('/login');
        }
    };

  return (
    <div className='flex justify-between items-center px-4 sm:px-10 py-6 border-b bg-white'>
        <div className='flex items-center gap-2 text-xs '>
            <img className='w-36 sm:w-40 cursor-pointer' src={assets.admin_logo} alt="logo" />
            <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600'>{aToken ? 'Admin' : 'Doctor'}</p>
        </div>
        <button  onClick={logout} className='bg-primary text-white text-sm px-10 py-2 rounded-full'>Logout</button>
    </div>
  )
}

export default Navbar