import { NotFoundM } from "@/masterComponents/NotFoundM";
import { NotFound } from "@/slaveComponents/NotFoundS";

export const NotFoundPage = (): JSX.Element => <NotFoundM Slave={NotFound} />;
