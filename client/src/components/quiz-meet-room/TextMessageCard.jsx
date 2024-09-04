import { Card, CardBody, CardFooter, CardHeader, Image } from "@nextui-org/react";
import PropTypes from "prop-types";

export default function TextMessageCard({ message }) {
  return (
    <Card className="min-w-48 max-w-fit" shadow="sm">
      <CardHeader className="flex pb-0 gap-2">
        <Image
          alt="nextui logo"
          height={20}
          radius="sm"
          src="https://avatars.githubusercontent.com/u/86160567?s=200&v=4"
          width={20}
        />
        <p className="text-sm">{message?.sender}</p>
      </CardHeader>
      <CardBody className={"py-0"}>
        <p>{message?.text}</p>
      </CardBody>
      <CardFooter className={"pt-0"}>
        <p className={"text-xs text-default-500"}>
          {new Date(message?.timeStamp).toLocaleTimeString()}
        </p>
      </CardFooter>
    </Card>
  );
}

TextMessageCard.propTypes = {
  message: PropTypes.object
};
