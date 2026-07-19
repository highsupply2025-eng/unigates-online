-- Allow approved institution administrators to upload and update
-- faculty avatars for members belonging to their own institution.

create or replace function public.can_manage_faculty_avatar(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select exists (
    select 1
    from public.institution_faculty_members ifm
    where ifm.user_id::text = (storage.foldername(object_name))[1]
      and (
        (
          ifm.institution_type = 'college'
          and exists (
            select 1
            from public.college_registrations cr
            where cr.id = ifm.institution_id
              and cr.status = 'approved'
              and lower(trim(cr.email)) =
                  lower(trim(coalesce(auth.jwt() ->> 'email', '')))
          )
        )
        or
        (
          ifm.institution_type = 'institute'
          and exists (
            select 1
            from public.institute_registrations ir
            where ir.id = ifm.institution_id
              and ir.status = 'approved'
              and lower(trim(ir.email)) =
                  lower(trim(coalesce(auth.jwt() ->> 'email', '')))
          )
        )
      )
  );
$$;

revoke all
on function public.can_manage_faculty_avatar(text)
from public;

grant execute
on function public.can_manage_faculty_avatar(text)
to authenticated;

drop policy if exists
  "Institution admins upload faculty avatars"
on storage.objects;

create policy
  "Institution admins upload faculty avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and public.can_manage_faculty_avatar(name)
);

drop policy if exists
  "Institution admins update faculty avatars"
on storage.objects;

create policy
  "Institution admins update faculty avatars"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and public.can_manage_faculty_avatar(name)
)
with check (
  bucket_id = 'avatars'
  and public.can_manage_faculty_avatar(name)
);
