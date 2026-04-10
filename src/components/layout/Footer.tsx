import { GLOBAL_CONSTANTS } from "@/constants/globalConstants";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <p className="text-sm text-gray-500">
          {GLOBAL_CONSTANTS.footerText.replace(
            "{currentYear}",
            currentYear.toString(),
          )}
        </p>
      </div>
    </div>
  );
}
