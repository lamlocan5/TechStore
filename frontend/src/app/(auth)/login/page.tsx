import { LoginForm } from "@/components/auth/LoginForm";
import { AuthHero } from "@/components/auth/AuthHero";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left - Form */}
            <div className="flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    <Card className="border-0 shadow-none">
                        <CardHeader className="space-y-1 pb-8">
                            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                Đăng nhập
                            </CardTitle>
                            <CardDescription className="text-center text-base">
                                Nhập thông tin đăng nhập của bạn
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <LoginForm />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Right - Hero */}
            <div className="hidden lg:block">
                <AuthHero type="login" />
            </div>
        </div>
    );
}
