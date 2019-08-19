import copy
import traceback
import sys
from pymongo import MongoClient, errors as MongoErrors

class Database:
    def __init__(self, host=None, port=27017, db='tester', collection_name='results'):
        try:
            print('[mongoDB] Connecting to ' + host + ':' + str(port))
            print('[mongoDB] Using Collection `' + collection_name + '` in Database `' + db + '`')
            self.client = MongoClient(host, port, serverSelectionTimeoutMS=3)
            self.db = self.client[db]
            self.results = self.db[collection_name]

            # test connection immediately, instead of
            # trying to write in a request, later.
            self.client.admin.command('ismaster')
        except MongoErrors.ServerSelectionTimeoutError:
            print(traceback.format_exc())
            sys.exit('MongoDB connection timed out.')
        except:
            print(traceback.format_exc())
            sys.exit('MongoDB connection failed.')

    def writeResult(self, result):
        # copy.deepcopy; otherwise mongo ObjectId (_id) would be added,
        # screwing up later JSON serialisation of results
        self.results.insert_one(copy.deepcopy(result))

def connect(host=None, port=27017, db='tester', collection_name='results'):
    if host is None:
        raise ValueError('[mongoDB] Database constructor needs a `host`name or ip!')

    return Database(host=host, port=port, db=db, collection_name=collection_name)
