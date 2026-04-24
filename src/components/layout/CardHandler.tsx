"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

export default function CardHandler({
  className,
  title,
  description,
  actions,
  children,
  filters,
  downloadButton,
}: {
  className?: string;
  title: string;
  description: string;
  actions: React.ReactNode;
  children: React.ReactNode;
  filters?: React.ReactNode;
  downloadButton?: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {actions}
      </CardHeader>

      <CardHeader>
        <CardTitle>{filters}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
