import{app}from'./app';app.listen(Number(process.env.PORT||3004),()=>console.log(JSON.stringify({level:'info',service:'payment-service',message:'listening',correlationId:'startup'})));
