import { Compass } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-navy-950 px-4 text-white">
      <Card className="max-w-md text-center">
        <Compass className="mx-auto mb-4 text-electric-400" size={42} />
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">The route you opened is not available in this portal.</p>
        <Link to="/dashboard" className="mt-6 inline-flex">
          <Button>Dashboard</Button>
        </Link>
      </Card>
    </div>
  );
}
