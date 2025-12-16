import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { useAppDispatch } from '@/store/hooks';
import { hydrateAuth } from '@/store/slices/auth.slice';

type PageProps = {
  auth?: {
    user?: {
      id: number | string;
      name: string;
      email: string;
      // Add other user properties here if needed
    } | null;
  };
};

export default function AuthHydrator() {
  const dispatch = useAppDispatch();
  const { props } = usePage<PageProps>();

  useEffect(() => {
    const user = props?.auth?.user ?? null;

    dispatch(
      hydrateAuth({
        user: user
          ? {
              id: typeof user.id === 'string' ? Number(user.id) : user.id,
              name: user.name,
              email: user.email,
            }
          : null,
      })
    );
  }, [dispatch, props?.auth?.user]);

  return null;
}
