import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const AVATAR_COLORS = [
  '#4F46E5', '#7C3AED', '#DB2777', '#DC2626',
  '#D97706', '#059669', '#0891B2', '#2563EB',
];

export function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function useUserProfile() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: base44.auth.me?.email }),
    staleTime: 1000 * 60 * 5,
    enabled: !!base44.auth.me,
  });

  const user = base44.auth.me;
  const hasProfile = Array.isArray(profile) && profile.length > 0;

  const createProfileMutation = useMutation({
    mutationFn: (data) => base44.entities.UserProfile.create({
      ...data,
      avatar_color: data.avatar_color || randomColor(),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfile'] }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.entities.UserProfile.update(profile?.[0]?.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfile'] }),
  });

  const saveProfile = async (data) => {
    if (hasProfile) {
      await updateProfileMutation.mutateAsync(data);
    } else {
      await createProfileMutation.mutateAsync(data);
    }
  };

  const isSaving = createProfileMutation.isPending || updateProfileMutation.isPending;

  const p = profile?.[0] ?? null;
  const displayName = p && (p.first_name || p.last_name)
    ? `${p.first_name || ''} ${p.last_name || ''}`.trim()
    : (user?.email || 'Utente');
  const initials = p && (p.first_name || p.last_name)
    ? `${(p.first_name || '')[0] || ''}${(p.last_name || '')[0] || ''}`.toUpperCase()
    : (user?.email?.[0]?.toUpperCase() || 'U');
  const avatarColor = p?.avatar_color || '#4F46E5';

  return {
    isLoading, profile: p, hasProfile, user, saveProfile, isSaving, randomColor,
    displayName, initials, avatarColor,
  };
}
