import Navbar from "~/components/navbar";

const Todo = () => {
  return (
    <div className="h-screen">
      <div className="flex h-full flex-col items-center justify-center lg:pl-24">
        <p>Todo</p>
      </div>
      <Navbar />
    </div>
  );
};

export default Todo;
