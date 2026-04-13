import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardContent } from "../../components/ui/Card";
import { KeyRound, Mail, AlertCircle } from "lucide-react";

export const Login = () => {
  const [email, setEmail] = useState("admin@dms.local");
  const [password, setPassword] = useState("P@ssw0rd!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const authData = await login({ email, password });
      
      // Route based on role
      if (authData.role === "Admin") navigate("/admin");
      else if (authData.role === "Staff") navigate("/staff");
      else if (authData.role === "Student") navigate("/student");
      else navigate("/");
      
        } catch (err) {
            const status = err?.response?.status;
            const apiMessage = err?.response?.data?.message || err?.response?.data?.Message;

            if (!err?.response) {
                setError("Backend'e baglanilamadi. API'nin http://localhost:5048 adresinde calistigini kontrol et.");
            } else if (status === 401) {
                setError("Kimlik dogrulama basarisiz. E-posta veya sifre hatali.");
            } else {
                setError(apiMessage || "Giris sirasinda beklenmeyen bir hata olustu.");
            }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-2xl border-0 overflow-hidden bg-white/90 backdrop-blur-sm">
        <CardContent className="p-8 sm:p-10 text-slate-800">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brandNavy to-blue-600 mb-2">Welcome Back</h2>
            <p className="text-slate-500 mb-8 font-medium">Please enter your credentials to continue.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}
                
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Mail size={18} />
                        </div>
                        <Input 
                            className="pl-10" 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="user@dms.local"
                            required
                        />
                    </div>
                </div>
                
                <div className="space-y-1">
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-sm font-semibold text-slate-700">Password</label>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <KeyRound size={18} />
                        </div>
                        <Input 
                            className="pl-10" 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>
                
                <Button 
                    type="submit" 
                    className="w-full py-6 text-base font-semibold tracking-wide" 
                    loading={loading}
                >
                    {loading ? "Signing In..." : "Sign In"}
                </Button>
            </form>
        </CardContent>
    </Card>
  );
};
