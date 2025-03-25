import pymongo
import certifi

connection_string = "mongodb+srv://chris:1234@fsdi-107.vtgxc.mongodb.net/?retryWrites=true&w=majority&appName=FSDI-107"

client = pymongo.MongoClient(connection_string, tlsCAFile=certifi.where())
db = client.get_database("organika")
