import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "./forms/LoginForm";

export default function Login() {
  return (
    <Card className="w-full max-w-md mx-auto ">
      <CardHeader>
        <CardTitle>Sign In To Your Account</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
