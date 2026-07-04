import { Chip } from "@nextui-org/chip";

interface QuizCategoriesProps {
  categories?: string[];
  isCard?: boolean;
  max?: number;
}

export default function QuizCategories({ categories, isCard = false, max }: QuizCategoriesProps) {
  const displayCategories = max ? categories?.slice(0, max) : categories;

  return (
    <ul className="flex flex-wrap gap-1">
      {displayCategories?.map((category, index) => (
        <li key={index}>
          <Chip
            className={"min-w-4 min-h-4 " + (isCard ? "my-1" : "")}
            classNames={{
              base: "bg-blue-800/20 text-blue-950",
              content: isCard ? "font-base" : "font-medium",
            }}
            color="primary"
            size="sm"
            radius="sm"
            variant="flat"
          >
            {category}
          </Chip>
        </li>
      ))}
    </ul>
  );
}
