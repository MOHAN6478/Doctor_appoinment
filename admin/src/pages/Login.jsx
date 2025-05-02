import React, { useContext, useState } from 'react'
import { AdminContext } from '../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { DoctorContext } from '../context/DoctorContext';

const Login = () => {

    const [ state, setState ] = useState('Admin');

    const [ email, setEmail ] = useState('');
    const [password, setPassword ] = useState('');

    const {setAToken, backendUrl} = useContext(AdminContext);

    const { setDToken } = useContext(DoctorContext)

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        try {
            if(state === 'Admin'){
                const { data } = await axios.post(backendUrl + '/api/admin/login', {email,password})
                if(data.success){
                    localStorage.setItem('aToken', data.token)
                    toast.success(data.message)
                    setAToken(data.token)
                }
            } else {
                const { data } = await axios.post(backendUrl + '/api/doctor/login', {email,password})
                if(data.success){
                    localStorage.setItem('dToken', data.token)
                    toast.success(data.message)
                    setDToken(data.token)
                    console.log(data.token)
                }
            }
        } catch (error) {
            console.log(error.message)
            toast.error(error.message)
        }
    }


  return (
    <form onClick={onSubmitHandler} className='min-h-screen flex items-center'>
        <div className='flex flex-col gap-3 m-auto items-center p-8 max-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
            <p className='text-2xl font-semibold m-auto'><span className='text-primary'>{state}</span>Login</p>
            <div className='w-full'>
                <p>Email</p>
                <input value={email} onChange={e => setEmail(e.target.value)} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="email" />
            </div>
            <div className='w-full'>
                <p>Password</p>
                <input value={password} onChange={e => setPassword(e.target.value)} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="password" />
            </div>
            <button className='bg-primary text-white w-full py-2 rounded-md text-base '>Login</button>
            {
                state === "Admin"
                ? <p>Doctor Login? <span className='text-primary underline cursor-pointer' onClick={()=>setState('Doctor')}>Click here</span></p>
                : <p>Admin Login? <span className='text-primary underline cursor-pointer' onClick={()=>setState('Admin')}>Click here</span></p>
            }
        </div>
    </form>
  )
}

export default Login