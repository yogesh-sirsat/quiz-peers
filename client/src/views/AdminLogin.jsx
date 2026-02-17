import React, { useState } from "react";
import { Card, Input, Button, Spacer, CardHeader, CardBody, Divider } from "@nextui-org/react";
import supabase from "../utils/supabase";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import NavbarComponent from "../components/ui/Navbar";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate("/admin");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavbarComponent isAdmin={true} />
      <div className="flex justify-center items-center h-[calc(100vh-64px)] px-4">
        <Card className="p-4 w-full max-w-md shadow-2xl border-none">
          <CardHeader className="flex flex-col gap-1 items-center pb-6 pt-8">
            <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
                <Lock size={32} />
            </div>
            <h1 className="text-3xl font-bold text-center text-foreground">Admin Access</h1>
            <p className="text-default-700 text-medium font-medium">Enter your credentials to manage quizzes</p>
          </CardHeader>
          <Divider className="mb-6" />
          <CardBody>
            <form onSubmit={handleLogin} className="space-y-6">
              <Input
                label="Email Address"
                placeholder="admin@example.com"
                variant="bordered"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                labelPlacement="outside"
                className="font-bold text-foreground"
                classNames={{
                    label: "text-foreground font-bold text-medium",
                }}
              />
              <Input
                label="Password"
                placeholder="••••••••"
                variant="bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                type="password"
                labelPlacement="outside"
                className="font-bold text-foreground"
                classNames={{
                    label: "text-foreground font-bold text-medium",
                }}
              />
              {error && (
                  <div className="p-3 rounded-lg bg-danger-50 text-danger text-xs font-bold border border-danger-200">
                      {error}
                  </div>
              )}
              <Spacer y={4} />
              <Button 
                color="primary" 
                type="submit" 
                className="w-full font-bold h-12 shadow-lg" 
                isLoading={loading}
              >
                Sign In to Dashboard
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
