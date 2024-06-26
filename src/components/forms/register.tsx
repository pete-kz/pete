import React, { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import axios, { AxiosResponse } from "axios"
import { axiosErrorHandler, filterValues } from "@utils"
import { API } from "@config"
import LoadingSpinner from "@/components/loading-spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "../ui/use-toast"
import { AnimatePresence, motion } from "framer-motion"
const PhoneInput = React.lazy(() => import("../ui/phone-input").then((module) => ({ default: module.PhoneInput })))

export function RegisterForm() {
	// Setups
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { toast } = useToast()
	const formSchema = z
		.object({
			firstName: z
				.string()
				.min(1, { message: t("notifications.firstName_req") })
				.optional(),
			lastName: z
				.string()
				.min(1, { message: t("notifications.lastName_req") })
				.optional(),
			phone: z
				.string()
				.min(7, { message: t("notifications.phone_length") })
				.includes("+", {
					message: t("notifications.phone_international"),
				}),
			instagram: z.string().optional(),
			type: z.enum(["private", "shelter"]),
			password: z.string().min(8, { message: t("notifications.password_length") }),
			password_repeat: z.string().min(8, { message: t("notifications.password_length") }),
			login: z.string().optional(),
		})
		.superRefine(({ password_repeat, password }, ctx) => {
			if (password_repeat !== password) {
				ctx.addIssue({
					code: "custom",
					message: t("notifications.passwordNoMatch"),
				})
			}
		})
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			phone: "+7",
			password: "",
			password_repeat: "",
			firstName: "",
			lastName: "",
			login: "",
			type: "private",
			instagram: "",
		},
	})

	// States
	const [loadingState, setLoadingState] = useState<boolean>(false)
	const [showInstagramInput, setShowInstagramInput] = useState<boolean>(false)
	const [currentPage, setCurrentPage] = useState<number>(1)

	// Functions
	function submitRegistration(values: z.infer<typeof formSchema>) {
		setLoadingState(true)
		axios
			.post(`${API.baseURL}/auth/register`, values)
			.then((response: AxiosResponse) => {
				if (!response.data.err) {
					navigate("/auth/login")
				} else {
					toast({ description: response.data.err })
				}
				setLoadingState(false)
				return
			})
			.catch(axiosErrorHandler)
	}

	function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (currentPage === 3) {
			form.handleSubmit(submitRegistration)(event)
			if (Object.keys(form.formState.errors).some(fieldName => Object.keys(form.getValues()).includes(fieldName))) { // this strange looking line checks if there are any errors in the form
				toast({ title: t("notifications.formErrorsTitle"), description: t("notifications.formErrors"), duration: 50000 })
			}
			return
		}

		nextStep(event)
	}

	function nextStep(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setCurrentPage((prev) => prev + 1)
	}

	function prevStep() {
		setCurrentPage((prev) => prev - 1)
	}

	return (
		<Form {...form}>
			<form onSubmit={onSubmit} className="w-full space-y-2">
				<AnimatePresence mode="wait">
					<motion.div layout>
						{currentPage === 1 && (
							<motion.div className="grd-cols-1 grid gap-1.5" key={"page1"} animate={{ opacity: 1 }} initial={{ opacity: 0 }} exit={{ opacity: 0 }}>
								<div className="flex w-full gap-1.5">
									<FormField
										control={form.control}
										name="firstName"
										render={({ field }) => (
											<FormItem className="w-full">
												<FormLabel>{t("user.firstName")}</FormLabel>
												<FormControl>
													<Input required className="w-full" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="lastName"
										render={({ field }) => (
											<FormItem className="w-full">
												<FormLabel>{t("user.lastName")}</FormLabel>
												<FormControl>
													<Input required className="w-full" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									control={form.control}
									name="login"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("label.login")}</FormLabel>
											<FormControl>
												<Input required {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("user.phone")}</FormLabel>
											<FormControl>
												{/* @ts-expect-error I dont understand what error mesasge wants from me, but this works so whatever */}
												<PhoneInput required defaultCountry="KZ" placeholder={t("user.phone")} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</motion.div>
						)}
						{currentPage === 2 && (
							<motion.div className="space-y-3" key={"page2"} animate={{ opacity: 1 }} initial={{ opacity: 0 }} exit={{ opacity: 0 }}>
								<FormField
									control={form.control}
									name="type"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("user.type.default")}</FormLabel>
											<Select
												onValueChange={(val) => {
													field.onChange(val)
													if (val != "private") {
														setShowInstagramInput(true)
													} else {
														setShowInstagramInput(false)
													}
												}}
												defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder={"-"} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{filterValues.owner_type.map((ownerType) => (
														<SelectItem key={ownerType} value={ownerType}>
															{t(`user.type.${ownerType}`)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								{showInstagramInput && (
									<FormField
										control={form.control}
										name="instagram"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("user.instagram")}</FormLabel>
												<FormControl>
													<Input required {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
							</motion.div>
						)}
						{currentPage === 3 && (
							<motion.div key={"page3"} animate={{ opacity: 1 }} initial={{ opacity: 0 }} exit={{ opacity: 0 }}>
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("user.password")}</FormLabel>
											<FormControl>
												<Input placeholder="" type="password" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="password_repeat"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("user.passwordConfirm")}</FormLabel>
											<FormControl>
												<Input placeholder="" type="password" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</motion.div>
						)}
					</motion.div>
				</AnimatePresence>
				<AnimatePresence>
					<div className="flex gap-2">
						{currentPage > 1 && (
							<motion.div layout animate={{ opacity: 1 }} initial={{ opacity: 0 }} exit={{ opacity: 0 }}>
								<Button type="button" variant="outline" onClick={prevStep}>
									{t("label.back")}
								</Button>
							</motion.div>
						)}
						<motion.div className="w-full" layout>
							<Button className="w-full" type="submit">
								{loadingState ? <LoadingSpinner /> : currentPage < 3 ? t("label.next") : t("button.register")}
							</Button>
						</motion.div>
					</div>
				</AnimatePresence>
			</form>
		</Form>
	)
}
