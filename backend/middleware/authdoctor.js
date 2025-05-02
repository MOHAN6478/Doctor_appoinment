import jwt from 'jsonwebtoken'

// doctor authentication middleware

const authDoctor = async (req,res,next) => {
    try {
        const  dToken  = req.headers['dtoken'];
        if(!dToken){
            return res.json({ success : false, message : 'Not Authorized Login again'})
        }

        
        const token_decode = jwt.verify(dToken, process.env.JWT_SECRET)

        req.docId = token_decode.id //Attach docId to the request object

        next();
    } catch (error) {
        console.log(error)
        res.json({ success : false, message : error.message})
    }
}

export default authDoctor;