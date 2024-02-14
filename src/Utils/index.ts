import axios from 'axios'
import React from 'react'
import { toast, type ToastOptions } from 'react-hot-toast'
import { useLocation } from 'react-router-dom'

const token = `${localStorage.getItem('_auth_type')} ${localStorage.getItem(
	'_auth',
)}`

const axiosAuth = axios.create({
	headers: {
		Authorization: token,
	},
})

const notificationConfig: ToastOptions = {
	className: 'rounded-lg border bg-card text-card-foreground shadow-sm w-full font-semibold',
	position: 'top-center',
}

interface Notification {
  custom: {
    error: (err: string) => void
    success: (msg: string) => void
    promise: (fn: any) => void
  }
}

const notification: Notification = {
	custom: {
		error: (err: string) => {
			toast.error(err, notificationConfig)
		},
		success: (msg: string) => {
			toast.success(msg, notificationConfig)
		},
		promise: (fn: any) => {
			toast.promise(
				fn,
				{
					loading: 'Загрузка...',
					success: 'Успешно загружено!',
					error: 'Произошла ошибка',
				},
				notificationConfig,
			)
		},
	}
}

function useQuery() {
    const { search } = useLocation()

    return React.useMemo(() => new URLSearchParams(search), [search])
}

function parseMongoDate(Mongo_Date: string) {
	// 2024-02-03T01:39:13.410+00:00
	const parsedTime = Mongo_Date.split('-')[2].split('T')[1].split('.')[0]
	const date = {
		year: Mongo_Date.split('-')[0],
		month: Mongo_Date.split('-')[1].split('T')[0][0] != '0' ? Mongo_Date.split('-')[1].split('T')[0] : Mongo_Date.split('-')[1].split('T')[0][1],
		day: Mongo_Date.split('-')[2].split('T')[0][0] != '0' ? Mongo_Date.split('-')[2].split('T')[0] : Mongo_Date.split('-')[2].split('T')[0][1],
		// time: Mongo_Date.split('-')[2].split('T')[1].split('.')[0]
	}
	// 01:39:13
	const time = {
		hour: parsedTime.split(':')[0][0] != '0' ? Number(parsedTime.split(':')[0]) : Number(parsedTime.split(':')[0][1]),
		minutes: parsedTime.split(':')[1][0] != '0' ? Number(parsedTime.split(':')[1]) : Number(parsedTime.split(':')[1][1])
	}
	return {
		date,
		time
	}
}

export { axiosAuth, notification, type Notification, useQuery, parseMongoDate }
