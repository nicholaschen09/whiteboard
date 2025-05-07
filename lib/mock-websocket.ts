export const createMockWebSocket = () => {
    const listeners = {
        message: [] as ((data: any) => void)[],
        open: [] as (() => void)[],
    }

    return {
        send: (data: string) => {
            // Simulate broadcasting to other users after a delay
            setTimeout(() => {
                const parsedData = JSON.parse(data)
                if (parsedData.type === "draw") {
                    listeners.message.forEach((listener) =>
                        listener({
                            data: JSON.stringify({
                                ...parsedData,
                                userId: Math.floor(Math.random() * 3) + 2, // Assign to a random user that's not the current user
                            }),
                        }),
                    )
                }
            }, 300)
        },
        addEventListener: (event: string, callback: any) => {
            if (event === "message") listeners.message.push(callback)
            if (event === "open") {
                listeners.open.push(callback)
                // Simulate connection open
                setTimeout(() => {
                    callback()
                }, 500)
            }
        },
        removeEventListener: () => { },
        close: () => { },
    }
} 