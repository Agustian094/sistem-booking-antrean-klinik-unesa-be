import express from "express";
import { z } from "zod";
import { getAuthenticatedContext, requireAuth, requireStaff } from "../middleware/auth.js";
import { asyncRoute } from "../utils/async-route.js";
import { databaseError } from "../utils/database-error.js";

export const apiRouter = express.Router();
apiRouter.use(requireAuth);

apiRouter.get(
  "/me",
  asyncRoute(async (req, res) => {
    const { supabase, user } = getAuthenticatedContext(req);
    const [
      { data: profile, error: profileError },
      { data: roles, error: rolesError },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, nim, faculty, phone")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    if (profileError) return databaseError(res, profileError);
    if (rolesError) return databaseError(res, rolesError);
    res.json({
      userId: user.id,
      email: user.email ?? "",
      profile: profile ?? null,
      isStaff: roles.some((role) => role.role === "petugas"),
    });
  }),
);

apiRouter.get(
  "/services",
  asyncRoute(async (req, res) => {
    const { supabase } = getAuthenticatedContext(req);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort_order");
    if (error) return databaseError(res, error);
    res.json(data);
  }),
);

apiRouter.get(
  "/time-slots",
  asyncRoute(async (req, res) => {
    const { supabase } = getAuthenticatedContext(req);
    const { data, error } = await supabase
      .from("time_slots")
      .select("*")
      .order("start_time");
    if (error) return databaseError(res, error);
    res.json(data);
  }),
);

apiRouter.get(
  "/slot-availability",
  asyncRoute(async (req, res) => {
    const query = z
      .object({
        serviceId: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .safeParse(req.query);
    if (!query.success)
      return res
        .status(400)
        .json({ error: "Layanan atau tanggal booking tidak valid." });

    const { supabase } = getAuthenticatedContext(req);
    const { data, error } = await supabase.rpc("get_slot_availability", {
      _service_id: query.data.serviceId,
      _date: query.data.date,
    });
    if (error) return databaseError(res, error);
    res.json(data ?? []);
  }),
);

apiRouter.get(
  "/queue-info",
  asyncRoute(async (req, res) => {
    const query = z
      .object({ bookingId: z.string().uuid() })
      .safeParse(req.query);
    if (!query.success)
      return res.status(400).json({ error: "Booking tidak valid." });

    const { supabase } = getAuthenticatedContext(req);
    const { data, error } = await supabase.rpc("get_queue_info", {
      _booking_id: query.data.bookingId,
    });
    if (error) return databaseError(res, error);
    res.json(data ?? null);
  }),
);

apiRouter.get(
  "/queue-overview",
  asyncRoute(async (req, res) => {
    const query = z
      .object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
      .safeParse(req.query);
    if (!query.success)
      return res.status(400).json({ error: "Tanggal antrean tidak valid." });

    const { supabase } = getAuthenticatedContext(req);
    const { data, error } = await supabase.rpc("queue_overview", {
      _date: query.data.date,
    });
    if (error) return databaseError(res, error);
    res.json(data ?? []);
  }),
);

apiRouter.get(
  "/my-bookings",
  asyncRoute(async (req, res) => {
    const { supabase, user } = getAuthenticatedContext(req);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("booking_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) return databaseError(res, error);
    res.json(data);
  }),
);

apiRouter.get(
  "/day-bookings",
  requireStaff,
  asyncRoute(async (req, res) => {
    const query = z
      .object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
      .safeParse(req.query);
    if (!query.success)
      return res.status(400).json({ error: "Tanggal antrean tidak valid." });

    const { supabase } = getAuthenticatedContext(req);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_date", query.data.date)
      .order("queue_number");
    if (error) return databaseError(res, error);
    res.json(data);
  }),
);

apiRouter.post(
  "/bookings",
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        serviceId: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        slotId: z.number().int().positive(),
      })
      .safeParse(req.body);
    if (!body.success)
      return res
        .status(400)
        .json({ error: "Layanan, tanggal, atau jadwal tidak valid." });

    const { supabase } = getAuthenticatedContext(req);
    const { data, error } = await supabase.rpc("create_booking", {
      _service_id: body.data.serviceId,
      _date: body.data.date,
      _slot_id: body.data.slotId,
    });
    if (error) return databaseError(res, error, 400);
    res.status(201).json(data);
  }),
);

apiRouter.post(
  "/bookings/:id/cancel",
  asyncRoute(async (req, res) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success)
      return res.status(400).json({ error: "Booking tidak valid." });

    const { supabase } = getAuthenticatedContext(req);
    const { error } = await supabase.rpc("cancel_booking", {
      _booking_id: params.data.id,
    });
    if (error) return databaseError(res, error, 400);
    res.status(204).end();
  }),
);

apiRouter.patch(
  "/bookings/:id/status",
  requireStaff,
  asyncRoute(async (req, res) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    const body = z
      .object({
        status: z.enum([
          "terkonfirmasi",
          "menunggu",
          "dipanggil",
          "dilayani",
          "selesai",
          "dibatalkan",
        ]),
      })
      .safeParse(req.body);
    if (!params.success || !body.success)
      return res
        .status(400)
        .json({ error: "Status atau booking tidak valid." });

    const { supabase } = getAuthenticatedContext(req);
    const { data, error } = await supabase
      .from("bookings")
      .update({ status: body.data.status })
      .eq("id", params.data.id)
      .select("id")
      .maybeSingle();
    if (error) return databaseError(res, error);
    if (!data)
      return res.status(404).json({ error: "Booking tidak ditemukan." });
    res.status(204).end();
  }),
);

apiRouter.post(
  "/demo-queue",
  requireStaff,
  asyncRoute(async (req, res) => {
    const { supabase } = getAuthenticatedContext(req);
    const { data, error } = await supabase.rpc("generate_demo_queue");
    if (error) return databaseError(res, error, 400);
    res.json(data);
  }),
);
