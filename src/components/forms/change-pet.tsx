import React, { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import useAuthUser from "react-auth-kit/hooks/useAuthUser"
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { axiosErrorHandler, filterValues } from "@utils"
import axios from "axios"
import { API } from "@config"
import LoadingSpinner from "@/components/loading-spinner"
import { Textarea } from "@/components/ui/textarea"
import ReactImageGallery, { ReactImageGalleryItem } from "react-image-gallery"
import { AuthState, Pet_Response } from "@/lib/declarations"
import { Checkbox } from "../ui/checkbox"
import { useToast } from "../ui/use-toast"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export default function ChangePetForm({ pet_id }: { pet_id: Pet_Response["_id"] }) {
	// Setups
	const { t } = useTranslation()
	const user = useAuthUser<AuthState>()
	const authHeader = useAuthHeader()
	const { toast } = useToast()
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const formSchema = z.object({
		name: z.string().min(2, {
			message: "Pets name cant be shorter than 2 characters!",
		}),
		birthDate: z.string(),
		type: z.string(),
		sterilized: z.boolean().default(false),
		weight: z.string(),
		sex: z.enum(["male", "female"]),
		description: z.string({ required_error: "Description is required!" }),
		breed: z.string().default(""),
	})
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			birthDate: "",
			type: "cat",
			sterilized: false,
			weight: "0",
			sex: "male",
			description: "",
			breed: "",
		},
	})
	const { data: petData } = useQuery<Pet_Response>({
		queryKey: ["pet", pet_id],
		queryFn: () => axios.get(`${API.baseURL}/pets/${pet_id}`).then((res) => res.data),
	})

	// States
	const [loadingState, setLoadingState] = useState<boolean>(false)
	const [files, setFiles] = useState<undefined | Blob[]>(undefined)
	const [images, setImages] = useState<ReactImageGalleryItem[]>([])

	// Functions
	function onSubmit(values: z.infer<typeof formSchema>) {
		if (user) {
			setLoadingState(true)
			const formData = new FormData()
			// let noPictureObjectFix
			formData.append("name", values.name)
			formData.append("birthDate", `${values.birthDate}`)
			formData.append("description", values.description)
			formData.append("type", values.type)
			formData.append("sterilized", JSON.stringify(values.sterilized))
			formData.append("weight", JSON.stringify(Number(values.weight)))
			formData.append("sex", values.sex)
			formData.append("ownerID", user._id)
			formData.append("breed", values.breed)
			formData.append("city", localStorage.getItem("_city") || "0")
			formData.append("imagesPath", JSON.stringify(images.map((img) => img.original)))
			if (files && images[0].original.includes("blob")) {
				for (let i = 0; i < files.length; i++) {
					formData.append("images", files[i])
				}
			}
			axios
				.post(`${API.baseURL}/pets/${pet_id}`, formData, {
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: authHeader,
					},
				})
				.catch(axiosErrorHandler)
				.finally(() => {
					setLoadingState(false)
					queryClient.invalidateQueries({
						queryKey: ["pet", pet_id],
					})
					queryClient.invalidateQueries({
						queryKey: ["user", user._id, "pets"],
					})
					toast({ description: t("pet.updated") })
					navigate("/pwa/profile")
				})
		}
	}

	function checkImage(file: Blob | undefined) {
		if (file == undefined) {
			return ""
		}
		return URL.createObjectURL(file)
	}

	useEffect(() => {
		const imagesObject: ReactImageGalleryItem[] = []
		files?.map((file) => {
			if (checkImage(file) != "") {
				imagesObject.push({
					original: checkImage(file),
					thumbnail: checkImage(file),
				})
			}
		})
		setImages(imagesObject)
	}, [files])

	useEffect(() => {
		if (petData) {
			form.setValue("name", petData.name)
			form.setValue("birthDate", petData.birthDate)
			form.setValue("description", petData.description)
			form.setValue("type", petData.type)
			form.setValue("sterilized", petData.sterilized)
			form.setValue("weight", JSON.stringify(petData.weight))
			form.setValue("sex", petData.sex)
			const imagesPath = petData.imagesPath.map((imgLink) => {
				return { original: imgLink, thumbnail: imgLink }
			})
			setImages(imagesPath)
			// Convert image URLs to Blob and update files state
			Promise.all(imagesPath.map((image) => fetch(image.original).then((res) => res.blob()))).then(setFiles)
		}
	}, [petData, form])

	useEffect(() => {
		if (petData && user?._id !== petData.ownerID) {
			navigate("/pwa/profile")
		}
	}, [])

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-2">
				<div className="mb-2">
					<ReactImageGallery items={images} showFullscreenButton={false} showPlayButton={false} />
				</div>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("pet.name")}</FormLabel>
							<FormControl>
								<Input disabled={loadingState} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="grid grid-cols-2 grid-rows-1 gap-1.5">
					<FormField
						control={form.control}
						name="type"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("pet.type.default")}</FormLabel>
								<Select disabled={loadingState} onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder={t("pet.type.default")} />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{filterValues.type.map((typepet) => (
											<SelectItem key={typepet} value={typepet}>
												{t(`pet.type.${typepet}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="birthDate"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("pet.birthDate")}</FormLabel>
								<FormControl>
									<Input disabled={loadingState} type="date" required {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<FormField
					control={form.control}
					name="sex"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("pet.sex.default")}</FormLabel>
							<Select disabled={loadingState} onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder={t("pet.sex.default")} />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{filterValues.sex.map((sex) => (
										<SelectItem key={sex} value={sex}>
											{t(`pet.sex.${sex}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="sterilized"
					render={({ field }) => (
						<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
							<FormControl>
								<Checkbox disabled={loadingState} checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel>{t("pet.sterilized")}?</FormLabel>
							</div>
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="weight"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("pet.weight")}</FormLabel>
							<FormControl>
								<Input disabled={loadingState} type="number" required {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("pet.description")}</FormLabel>
							<FormControl>
								<Textarea disabled={loadingState} required {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="grid w-full items-center gap-1.5">
					<label htmlFor="picture">{t("pet.add.img")}</label>
					<Input
						id="picture"
						disabled={loadingState}
						type="file"
						accept="image/png, image/jpeg, image/jpg"
						multiple
						onChange={(event) => {
							const files = event.target.files ? Array.from(event.target.files) : []
							setFiles(files)
						}}
					/>
				</div>
				<Button
					onClick={() => {
						console.log(form.formState.errors)
					}}
					className="w-full"
					type="submit">
					{loadingState ? <LoadingSpinner /> : t("button.update")}
				</Button>
			</form>
		</Form>
	)
}
