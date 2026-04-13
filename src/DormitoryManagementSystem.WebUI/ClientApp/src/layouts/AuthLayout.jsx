import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

export const AuthLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-start p-16 bg-gradient-to-br from-brandNavy to-blue-900 text-white relative overflow-hidden">
        <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10"
        >
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight">DormSync</h1>
          <p className="text-xl text-blue-100 max-w-md font-light leading-relaxed">
            The next generation of campus living. Secure, intuitive, and seamlessly connected dormitory operations at your fingertips.
          </p>
        </motion.div>
        
        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white opacity-5 rounded-full blur-3xl mix-blend-overlay"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-blue-500 opacity-10 rounded-full blur-3xl mix-blend-overlay"></div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-50">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md"
        >
            <Outlet />
        </motion.div>
      </div>
    </div>
  );
};
