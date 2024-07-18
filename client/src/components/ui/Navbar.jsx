import { useState, useEffect } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  Link,
  // DropdownItem,
  // DropdownTrigger,
  // Dropdown,
  // DropdownMenu,
  // Avatar,
} from "@nextui-org/react";
import { useNavigate } from "react-router-dom";

export default function NavbarComponent() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavbarBlurred, setIsNavbarBlurred] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsNavbarBlurred(true);
      } else {
        setIsNavbarBlurred(false);
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
  }, []);

  return (
    <Navbar
      isBlurred={isNavbarBlurred}
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      isBordered
      className="bg-background/0 dark"
      id="navbar"
    >
      <NavbarBrand>
        {/* <Avatar
          isBordered
          as="button"
          className="transition-transform"
          color="secondary"
          name="Jason Hughes"
          size="md"
          radius="lg"
          src="https://i.pravatar.cc/150?u=a04258114e29026302d"
        /> */}
        <Link
          className="cursor-pointer"
          color="foreground"
          onPress={() => {
            navigate("/");
            window.scrollTo(0, 0);
          }}
        >
          <h1 className="font-semibold text-3xl">QUIZ PEERS</h1>
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden xs:flex gap-4" justify="center">
        <NavbarItem>
          <h3 className="text-xl">
            Play Quizzes in Real-Time with Friend&apos;s or Stranger&apos;s
          </h3>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
