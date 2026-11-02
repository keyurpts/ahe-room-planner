export function PlannerIntroduction() {
  return (
    <section
      aria-labelledby="planner-title"
      className="planner-introduction bg-brand px-4 text-center text-white max-lg:bg-brand-hover sm:px-6"
    >
      <div className="mx-auto max-w-introduction">
        <h1 id="planner-title" className="text-planner-title font-bold uppercase">
          Flatpax online planner
        </h1>
        <p className="planner-description mx-auto max-w-description text-planner-description font-medium uppercase">
          <span className="xl:block">Plan your space by using a pre-designed</span>{' '}
          <span className="xl:block">layout, start a new design from scratch,</span>{' '}
          <span className="xl:block">or open a saved design</span>
        </p>
      </div>
    </section>
  );
}
