#include <iostream>
#include <cstdlib>
#include <string>
#include <memory>
#include <fstream>
#include <mutex>
#include <map>
#include <mysql_driver.h>
#include <mysql_connection.h>
#include <cppconn/driver.h>
#include <cppconn/exception.h>
#include <cppconn/prepared_statement.h>
#include <cppconn/statement.h>
#include <cppconn/resultset.h>
#include <cppconn/resultset_metadata.h>
#include <nlohmann/json.hpp>

#define ADDR "tcp://localhost:3306"
#define SQLUSERNAME "antaresz"
#define SQLPASSWORD "170319"
#define DBNAME "GPOS"

class MySQLConn {
public:
	MySQLConn() 
		:addr(ADDR), username(SQLUSERNAME), password(SQLPASSWORD), dbname(DBNAME) {}
	void Link();
	nlohmann::json ExeQuery(std::string command);
	void ShowInfo();
private:
	std::string addr;
	std::string username;
	std::string password;
	std::string dbname;
	std::unique_ptr<sql::Connection> con;
};

class PCPipe {
public:
    PCPipe(const std::string& pipename, bool iswriter)
        : pipe_name(pipename), is_writer(iswriter) {
        OpenPipe();
    }
    ~PCPipe() {
        ClosePipe();
    }
    bool Write(const std::string& message);
    bool Read(std::string& message);
private:
    std::fstream pipe_stream;
    std::string pipe_name;
    bool is_writer;
    std::mutex mutex;

    void OpenPipe();
    void ClosePipe();
};

class ArgumentParser {
public:
	ArgumentParser(int argc, char** argv);
    std::string GetArgument(const std::string& key);
private:
    std::map<std::string, std::string> arguments;
	void ArgumentCheck(int argc);
};


bool PCPipe::Write(const std::string& message) {
	std::lock_guard<std::mutex> lock(mutex);
	if (!is_writer || !pipe_stream.is_open()) {
		return false;
	}

	pipe_stream << message << std::endl;
	if (pipe_stream.fail()) {
		std::cerr << "Failed to write to pipe." << std::endl;
		return false;
	}

	return true;
}
bool PCPipe::Read(std::string& message) {
	std::lock_guard<std::mutex> lock(mutex);
	if(is_writer || !pipe_stream.is_open()) return false;
	
	return static_cast<bool>(std::getline(pipe_stream, message));
}

void PCPipe::OpenPipe() {
	std::lock_guard<std::mutex> lock(mutex);
	
	if(is_writer) {
		pipe_stream.open(pipe_name, std::ios::out);
	} else {
		pipe_stream.open(pipe_name, std::ios::in);
	}
	
	if(!pipe_stream.is_open()) {
		std::cerr << "Failed to open pipe: " << pipe_name << std::endl;
	}
}

void PCPipe::ClosePipe() {
	std::lock_guard<std::mutex> lock(mutex);
	if(pipe_stream.is_open()) {
		pipe_stream.close();
	}
}

void MySQLConn::Link() {
	try {
		sql::Driver* driver = get_driver_instance();
		con = std::unique_ptr<sql::Connection>(driver->connect(addr, username, password));
		con->setSchema(dbname);
	} catch (sql::SQLException& e) {
		std::cerr << e.what() << "\n";
	}
}

nlohmann::json MySQLConn::ExeQuery(std::string command) {
	if(!con) {
		nlohmann::json json_error;
		return json_error;
	}
	
	nlohmann::json json_result;
	std::unique_ptr<sql::Statement> stmt(con->createStatement());
	std::unique_ptr<sql::ResultSet> res(stmt->executeQuery(command));
	sql::ResultSetMetaData*  meta(res->getMetaData());
	unsigned int column_nums = meta->getColumnCount();
	
	while (res->next()) {
		nlohmann::json json_object;
		
		for(auto i = 1;i <= column_nums; i++) {
			std::string column_name = meta->getColumnName(i);
			json_object = res->getString(column_name);
		}
		
		json_result.push_back(json_object);
	}
	
	return json_result;
}

void MySQLConn::ShowInfo() {
	std::cout << "host: " << addr << "\n";
	std::cout << "username: " << username << "\n";
	std::cout << "dbname: " << dbname << "\n";
}

ArgumentParser::ArgumentParser(int argc, char** argv) {
	ArgumentCheck(argc);
	for (int i = 1; i < argc; ++i) {
		std::string key(argv[i]);
		if(key[0] == '-') {
			if(key[1] == '-') {		
				if (i + 1 < argc) {
					arguments[key] = argv[++i];
				} else {
					std::cerr << "Argument is required.\n";
					exit(-1);
				}
			} else if (key[1] >= 65 && key[1] <= 97) {
				arguments[key] = key;
			} else {
				std::cerr << "Argument fault.\n";
			}
		} else {
			std::cerr << "Argument's position wrong.\n";
			exit(-1);
		}
	}
}
	
std::string ArgumentParser::GetArgument(const std::string& key) {
	return arguments.count(key) ? arguments[key] : "";
}

void ArgumentParser::ArgumentCheck(int argc) {
	if(argc == 1) {
		std::cerr << "Lack of argument\n";
		exit(-1);
	}
	return;
}

int main(int argc, char* argv[]) {
	class ArgumentParser args(argc, argv);
	std::string command;
	std::string userid = args.GetArgument("--userid");
	std::string username = args.GetArgument("--username");
	std::string image_type = args.GetArgument("--image_type");
	std::string image_path = args.GetArgument("--image_path");
	std::string iflogin = args.GetArgument("-L");
	nlohmann::json query_res;

	MySQLConn sqlmanager;
	sqlmanager.Link();
	
	if(userid.empty()) {
		std::cerr << "userid required.\n";
		return -1;
	} else if(iflogin == "-L") {
		command = "SELECT FROM USER WHERE userid = " + userid + ";"; 
		query_res = sqlmanager.ExeQuery(command);
		if(!query_res) {
			command = "INSERT INTO USER (username, userid, use_times) VALUES (\"" + username + "\", \"" + userid + "\", " + "0" + ");";
		}
	} else {
		//sql部分
	}
	return 0;
}
