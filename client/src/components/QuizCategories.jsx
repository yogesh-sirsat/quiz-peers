import { Chip } from "@nextui-org/chip";
import PropTypes from "prop-types";

export default function QuizCategories({ categories, isCard = false }) {
  return (
    <ul className="flex flex-wrap gap-1">
      {categories?.map((category, index) => (
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

QuizCategories.propTypes = {
  categories: PropTypes.array,
  isCard: PropTypes.bool,
};
