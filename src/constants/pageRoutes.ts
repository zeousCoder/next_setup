// here we can centralize the page routes so that we can use them in the entire application

export const PAGE_ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  CONTACT: "/contact",
  LOGIN: "/login",
  SIGNUP: "/signup",
} as const;

// here we can create dynamic page routes so that we can use them in the entire application
export const dynamicPageRoutes = {
  ParticularLogin: (id: string | number) => {
    return `${PAGE_ROUTES.LOGIN}?id=${id}`;
  },
};
