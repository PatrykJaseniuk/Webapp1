import { Link } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import type { NavLink } from '@/generic';

type NavLinkTo = Readonly<{
  readonly login: NavLink;
}>;

type NotFoundSProps = {
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<NotFoundSProps>;
};

export const NotFoundM = ({ Slave }: Props): JSX.Element => {
  const navLinkTo: NavLinkTo = {
    login: ({ content, style }) => <Link to="/login" style={style}>{content}</Link>,
  };

  return <Slave navLinkTo={navLinkTo} />;
};