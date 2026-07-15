export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  // Exact match or starts with href followed by a slash (nested route)
  return pathname === href || pathname.startsWith(`${href}/`);
}
