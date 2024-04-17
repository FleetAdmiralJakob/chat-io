import { Input } from "~/components/ui/input";

export default async function Search() {
  return (
    <div>
      <div className="mt-3 flex justify-center">
        <Input placeholder="Search ..." className="w-3/4 lg:w-2/6" />
      </div>
    </div>
  );
}
