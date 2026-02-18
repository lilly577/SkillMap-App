import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Contact = () => {
    const navigate = useNavigate();

return (
  <div className="p-8 max-w-3xl mx-auto">
    {/* Back button at the top */}
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="fixed top-16 left-6 flex items-center"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

    <h1 className="text-2xl font-bold mb-4">Contact Us</h1>
    <p>
      If you have any questions or feedback, feel free to reach out to us at:
    </p>
    <p className="mt-2"> <b>Email:</b> info@gmail.com <hr></hr>
                                support@gmail.com</p>
       <br></br>                         
    <p><b>Phone:</b> +254 757736697 <hr></hr>
                     +254 115243198</p>

    </div>
 
);
};
export default Contact;
