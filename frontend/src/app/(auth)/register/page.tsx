import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthHero } from "@/components/auth/AuthHero";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left - Form */}
            <div className="flex items-center justify-center p-8 bg-white overflow-y-auto">
                <div className="w-full max-w-2xl py-8">
                    <Card className="border-0 shadow-none">
                        <CardHeader className="space-y-1 pb-8">
                            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                Tạo tài khoản
                            </CardTitle>
                            <CardDescription className="text-center text-base">
                                Nhập thông tin của bạn để bắt đầu
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RegisterForm />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Right - Hero */}
            <div className="hidden lg:block">
                <AuthHero type="register" />
            </div>
        </div>
    );
}
