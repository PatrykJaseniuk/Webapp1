import { Link } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import type { NavLink } from '@/generic';

type NavLinkTo = Readonly<{
  readonly login: NavLink;
}>;

type AccessDeniedSProps = {
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<AccessDeniedSProps>;
};

export const AccessDeniedM = ({ Slave }: Props): JSX.Element => {
  const navLinkTo: NavLinkTo = {
    login: ({ content, style }) => <Link to="/login" style={style}>{content}</Link>,
  };

  return <Slave navLinkTo={navLinkTo} />;
};