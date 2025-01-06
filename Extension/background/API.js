import StorageService from "./storageService.js";

export default class API {
	static serverUrl = process.env.SERVER_URL;
	// static serverUrl = 'http://localhost:5000/api/v1';
    static async createHeaders() {
        const token = await StorageService.get('access_token');
        if (!token) {
            console.error('No token found.');
            throw new Error('No token found.');
            // return;
        }
        const headers =  {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };
        console.log('[API.createHeaders] Headers:', headers);
        return headers;
    }

    static async handleResponse(response) {
        if (!response.ok) {
            const data = await response.json();
            if(data.statusCode === 401){
                console.error('Unauthorized. Clearing auth token.');
                await StorageService.remove('access_token');
            }
            console.error('API Error:', data);
            throw new Error(data.error);
        }
        return response.json();
    }

	static async get(url) {
		try {
			const completeUrl = `${API.serverUrl}${url}`;

			const response = await fetch(completeUrl, {
				method: 'GET',
				headers: await this.createHeaders(),
			});
			const data = await this.handleResponse(response);

			// if(!data.success){
			// 	console.error("GET", completeUrl, "Error:", data.error);
			// 	throw new Error(data.error);
			// }

			console.log(
				"GET",
				completeUrl,
				"Response:",
				data
			)

			return data;
		} catch (err) {
			console.error(err);
            return {success:false, error:err.toString()};
		}
	}

	static async post(url, body) {
		try {
            
			const completeUrl = `${this.serverUrl}${url}`;
            console.log("POST", completeUrl, "Body:", JSON.stringify(body));
			const response = await fetch(completeUrl, {
				method: 'POST',
				headers: await this.createHeaders(),
				body: JSON.stringify(body),
			});
            const data = await this.handleResponse(response);

			console.log(
				"POST",
				completeUrl,
				"Response:",
				data
			)

			return data;
		} catch (err) {
			console.error(err);
            return {success:false, error:err.toString()};
            // throw err;
		}
	}
}